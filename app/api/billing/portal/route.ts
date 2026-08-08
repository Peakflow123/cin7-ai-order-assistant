import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const session = getSession();
    if (!session) return NextResponse.redirect(new URL('/login', request.url));
    if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is missing.');

    const rows = await prisma.$queryRaw<Array<{ stripeCustomerId: string | null }>>`
      SELECT "stripeCustomerId" FROM "Company" WHERE "id" = ${session.companyId} LIMIT 1
    `;
    const customer = rows[0]?.stripeCustomerId;
    if (!customer) throw new Error('No Stripe customer is linked to this company yet.');
    const baseUrl = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

    const params = new URLSearchParams();
    params.set('customer', customer);
    params.set('return_url', `${baseUrl}/billing`);

    const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });
    const data = await response.json();
    if (!response.ok) throw new Error(`Stripe portal error: ${JSON.stringify(data)}`);
    return NextResponse.redirect(data.url, { status: 303 });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Could not open billing portal.' }, { status: 500 });
  }
}
