import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { stripePriceEnvForPlan } from '@/lib/billing';

export async function POST(request: Request) {
  try {
    const session = getSession();
    if (!session) return NextResponse.redirect(new URL('/login', request.url));

    const formData = await request.formData();
    const plan = String(formData.get('plan') || '').toLowerCase();
    const priceId = stripePriceEnvForPlan(plan);

    if (!priceId) throw new Error(`Stripe price is not configured for plan: ${plan}`);
    if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is missing.');

    const companyRows = await prisma.$queryRaw<Array<{ id: string; name: string; stripeCustomerId: string | null }>>`
      SELECT "id", "name", "stripeCustomerId"
      FROM "Company"
      WHERE "id" = ${session.companyId}
      LIMIT 1
    `;

    const company = companyRows[0];
    if (!company) throw new Error('Company not found.');

    const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { email: true } });
    const baseUrl = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

    const params = new URLSearchParams();
    params.set('mode', 'subscription');
    params.set('line_items[0][price]', priceId);
    params.set('line_items[0][quantity]', '1');
    params.set('success_url', `${baseUrl}/billing?checkout=success`);
    params.set('cancel_url', `${baseUrl}/billing?checkout=cancelled`);
    params.set('client_reference_id', company.id);
    params.set('metadata[companyId]', company.id);
    params.set('metadata[plan]', plan);
    params.set('subscription_data[metadata][companyId]', company.id);
    params.set('subscription_data[metadata][plan]', plan);
    params.set('allow_promotion_codes', 'true');

    if (company.stripeCustomerId) params.set('customer', company.stripeCustomerId);
    else if (user?.email) params.set('customer_email', user.email);

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    const data = await response.json();
    if (!response.ok) throw new Error(`Stripe Checkout error: ${JSON.stringify(data)}`);

    // IMPORTANT:
    // Do not update Company plan/status here. The user has only opened Stripe Checkout.
    // Company subscription data must be updated only after Stripe confirms payment/subscription
    // through /api/stripe/webhook, especially checkout.session.completed and subscription events.
    return NextResponse.redirect(data.url, { status: 303 });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Could not start Stripe Checkout.' }, { status: 500 });
  }
}
