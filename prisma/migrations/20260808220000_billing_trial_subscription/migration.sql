ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT NOT NULL DEFAULT 'trialing';
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "trialStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '15 days');
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "planName" TEXT NOT NULL DEFAULT 'trial';
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "monthlyOrderLimit" INTEGER NOT NULL DEFAULT 100;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "subscriptionCurrentPeriodEnd" TIMESTAMP(3);
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "billingEmail" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "billingNotes" TEXT;

UPDATE "Company"
SET
  "subscriptionStatus" = COALESCE(NULLIF("subscriptionStatus", ''), 'trialing'),
  "planName" = COALESCE(NULLIF("planName", ''), 'trial'),
  "monthlyOrderLimit" = CASE WHEN "monthlyOrderLimit" IS NULL OR "monthlyOrderLimit" <= 0 THEN 100 ELSE "monthlyOrderLimit" END,
  "trialStartedAt" = COALESCE("trialStartedAt", CURRENT_TIMESTAMP),
  "trialEndsAt" = COALESCE("trialEndsAt", CURRENT_TIMESTAMP + INTERVAL '15 days');

CREATE INDEX IF NOT EXISTS "Company_subscriptionStatus_idx" ON "Company"("subscriptionStatus");
CREATE INDEX IF NOT EXISTS "Company_stripeCustomerId_idx" ON "Company"("stripeCustomerId");
CREATE INDEX IF NOT EXISTS "Company_stripeSubscriptionId_idx" ON "Company"("stripeSubscriptionId");
