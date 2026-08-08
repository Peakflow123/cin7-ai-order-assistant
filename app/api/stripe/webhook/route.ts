import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { limitForPlan } from '@/lib/billing';

export const dynamic = 'force-dynamic';

function timingSafeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) return false;
  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function verifyStripeSignature(rawBody: string, signatureHeader: string | null, secret: string) {
  if (!signatureHeader) throw new Error('Missing Stripe signature header.');
  const parts = Object.fromEntries(signatureHeader.split(',').map((part) => {
    const [key, value] = part.split('=');
    return [key, value];
  }));
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) throw new Error('Invalid Stripe signature header.');
  const payload = `${timestamp}.${rawBody}`;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  if (!timingSafeEqual(expected, signature)) throw new Error('Invalid Stripe signature.');
}

async function updateCompanyFromSubscription(subscription: any) {
  const companyId = subscription.metadata?.companyId;
  const plan = subscription.metadata?.plan || 'professional';
  if (!companyId) return;

  const stripeCustomerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
  const currentPeriodEnd = subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null;
  let status = String(subscription.status || 'active');
  if (status === 'active' || status === 'trialing') status = 'active';
  else if (status === 'past_due' || status === 'unpaid') status = 'past_due';
  else if (status === 'canceled' || status === 'cancelled') status = 'cancelled';

  await prisma.$executeRaw`
    UPDATE "Company"
    SET
      "subscriptionStatus" = ${status},
      "planName" = ${plan},
      "monthlyOrderLimit" = ${limitForPlan(plan)},
      "stripeCustomerId" = ${stripeCustomerId || null},
      "stripeSubscriptionId" = ${subscription.id || null},
      "subscriptionCurrentPeriodEnd" = ${currentPeriodEnd}
    WHERE "id" = ${companyId}
  `;
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET is missing.');
    verifyStripeSignature(rawBody, request.headers.get('stripe-signature'), secret);

    const event = JSON.parse(rawBody);
    const data = event.data?.object;

    if (event.type === 'checkout.session.completed') {
      const companyId = data.metadata?.companyId || data.client_reference_id;
      const plan = data.metadata?.plan || 'professional';
      if (companyId) {
        await prisma.$executeRaw`
          UPDATE "Company"
          SET
            "subscriptionStatus" = 'active',
            "planName" = ${plan},
            "monthlyOrderLimit" = ${limitForPlan(plan)},
            "stripeCustomerId" = ${data.customer || null},
            "stripeSubscriptionId" = ${data.subscription || null}
          WHERE "id" = ${companyId}
        `;
      }
    }

    if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      await updateCompanyFromSubscription(data);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Stripe webhook failed.' }, { status: 400 });
  }
}
