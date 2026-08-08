import { prisma } from '@/lib/db';

export type BillingStatus = 'trialing' | 'trial_expired' | 'active' | 'past_due' | 'cancelled' | 'suspended';

export const BILLING_PLANS = {
  trial: {
    label: 'Free Trial',
    priceLabel: '15 days free',
    monthlyOrderLimit: 100,
    mailboxLabel: '1 connected mailbox',
    description: 'No credit card required. Try NexOrder AI with real orders.'
  },
  starter: {
    label: 'Starter',
    priceLabel: '$49/month',
    monthlyOrderLimit: 300,
    mailboxLabel: '1 Gmail or Outlook mailbox',
    description: 'For smaller teams starting with AI order automation.'
  },
  professional: {
    label: 'Professional',
    priceLabel: '$149/month',
    monthlyOrderLimit: 1500,
    mailboxLabel: '3 Gmail/Outlook mailboxes',
    description: 'For teams processing customer orders every day.'
  },
  business: {
    label: 'Business',
    priceLabel: '$299/month',
    monthlyOrderLimit: 5000,
    mailboxLabel: '5+ mailboxes',
    description: 'For higher-volume order operations.'
  }
} as const;

export type BillingPlanName = keyof typeof BILLING_PLANS;

type BillingRow = {
  id: string;
  name: string;
  subscriptionStatus: BillingStatus;
  trialStartedAt: Date;
  trialEndsAt: Date;
  planName: string;
  monthlyOrderLimit: number;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  subscriptionCurrentPeriodEnd: Date | null;
};

function currentMonthStart() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
}

export function limitForPlan(plan: string) {
  if (plan === 'starter') return BILLING_PLANS.starter.monthlyOrderLimit;
  if (plan === 'professional') return BILLING_PLANS.professional.monthlyOrderLimit;
  if (plan === 'business') return BILLING_PLANS.business.monthlyOrderLimit;
  return BILLING_PLANS.trial.monthlyOrderLimit;
}

export function stripePriceEnvForPlan(plan: string) {
  if (plan === 'starter') return process.env.STRIPE_PRICE_STARTER || null;
  if (plan === 'professional') return process.env.STRIPE_PRICE_PROFESSIONAL || null;
  if (plan === 'business') return process.env.STRIPE_PRICE_BUSINESS || null;
  return null;
}

export async function getCompanyBilling(companyId: string) {
  const rows = await prisma.$queryRaw<BillingRow[]>`
    SELECT
      "id",
      "name",
      "subscriptionStatus"::text AS "subscriptionStatus",
      "trialStartedAt",
      "trialEndsAt",
      "planName",
      "monthlyOrderLimit",
      "stripeCustomerId",
      "stripeSubscriptionId",
      "subscriptionCurrentPeriodEnd"
    FROM "Company"
    WHERE "id" = ${companyId}
    LIMIT 1
  `;
  const company = rows[0];
  if (!company) throw new Error('Company not found.');

  let status = company.subscriptionStatus || 'trialing';
  if (status === 'trialing' && company.trialEndsAt && company.trialEndsAt.getTime() < Date.now()) {
    status = 'trial_expired';
    await prisma.$executeRaw`
      UPDATE "Company"
      SET "subscriptionStatus" = 'trial_expired'
      WHERE "id" = ${companyId} AND "subscriptionStatus" = 'trialing'
    `;
  }

  const orderRows = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM "Order"
    WHERE "companyId" = ${companyId}
      AND "createdAt" >= ${currentMonthStart()}
  `;

  const ordersThisMonth = Number(orderRows[0]?.count || 0);
  const monthlyOrderLimit = company.monthlyOrderLimit || limitForPlan(company.planName || 'trial');
  const trialDaysRemaining = status === 'trialing' ? Math.max(0, Math.ceil((company.trialEndsAt.getTime() - Date.now()) / 86400000)) : 0;

  return {
    ...company,
    subscriptionStatus: status,
    monthlyOrderLimit,
    ordersThisMonth,
    remainingOrders: Math.max(0, monthlyOrderLimit - ordersThisMonth),
    trialDaysRemaining,
    isAccessAllowed: status === 'trialing' || status === 'active',
    isOrderLimitReached: ordersThisMonth >= monthlyOrderLimit
  };
}

export async function assertCanProcessOrder(companyId: string) {
  const billing = await getCompanyBilling(companyId);
  if (!billing.isAccessAllowed) {
    throw new Error('Your trial or subscription is not active. Please open Billing to continue using NexOrder AI.');
  }
  if (billing.isOrderLimitReached) {
    throw new Error(`Monthly order limit reached (${billing.ordersThisMonth}/${billing.monthlyOrderLimit}). Please upgrade your plan to continue processing orders.`);
  }
  return billing;
}
