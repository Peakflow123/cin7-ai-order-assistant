import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { limitForPlan } from '@/lib/billing';

export const dynamic = 'force-dynamic';

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function verifyStripeSignature(rawBody: string, signatureHeader: string | null, secret: string) {
  if (!signatureHeader) throw new Error('Missing Stripe signature header.');
  const parts = signatureHeader.split(',').reduce<Record<string, string>>((acc, part) => {
    const [key, value] = part.split('=');
    if (key && value) acc[key] = value;
    return acc;
  }, {});
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) throw new Error('Invalid Stripe signature header.');
  const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
  if (!safeEqual(expected, signature)) throw new Error('Invalid Stripe signature.');
}

async function updateCompanyFromSubscription(subscription: any) {
  const companyId = subscription.metadata?.companyId;
  const plan = subscription.metadata?.plan || 'professional';
  if (!companyId) return;

  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
  const currentPeriodEnd = subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null;
  let status = String(subscription.status || 'active');

  if (status === 'active' || status === 'trialing') status = 'active';
  else if (status === 'past_due' || status === 'unpaid' || status === 'incomplete') status = 'past_due';
  else if (status === 'canceled' || status === 'cancelled') status = 'cancelled';

  await prisma.$executeRaw`
    UPDATE "Company"
    SET
      "subscriptionStatus" = ${status},
      "planName" = ${plan},
      "monthlyOrderLimit" = ${limitForPlan(plan)},
      "stripeCustomerId" = ${customerId || null},
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
    const object = event.data?.object;

    if (event.type === 'checkout.session.completed') {
      const companyId = object.metadata?.companyId || object.client_reference_id;
      const plan = object.metadata?.plan || 'professional';
      if (companyId) {
        await prisma.$executeRaw`
          UPDATE "Company"
          SET
            "subscriptionStatus" = 'active',
            "planName" = ${plan},
            "monthlyOrderLimit" = ${limitForPlan(plan)},
            "stripeCustomerId" = ${object.customer || null},
            "stripeSubscriptionId" = ${object.subscription || null}
          WHERE "id" = ${companyId}
        `;
      }
    }

    if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      await updateCompanyFromSubscription(object);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Stripe webhook failed.' }, { status: 400 });
  }
}
