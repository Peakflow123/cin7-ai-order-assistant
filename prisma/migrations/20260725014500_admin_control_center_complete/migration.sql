-- NexOrder AI Admin Control Center Complete Pack
-- Additive only. No auth/session changes.

ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "isArchived" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "planName" TEXT NOT NULL DEFAULT 'Starter';
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "monthlyOrderLimit" INTEGER;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP(3);
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "adminNotes" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "lastAdminActivityAt" TIMESTAMP(3);
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "allowClientEditCin7Settings" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "allowClientReconnectEmail" BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "autoCreateEnabled" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "autoCreateThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.95;

CREATE TABLE IF NOT EXISTS "ActivityLog" (
  "id" TEXT PRIMARY KEY,
  "companyId" TEXT,
  "actorUserId" TEXT,
  "actorEmail" TEXT,
  "action" TEXT NOT NULL,
  "targetType" TEXT,
  "targetId" TEXT,
  "message" TEXT NOT NULL,
  "details" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "ActivityLog_company_created_idx" ON "ActivityLog"("companyId", "createdAt");
CREATE INDEX IF NOT EXISTS "ActivityLog_actor_created_idx" ON "ActivityLog"("actorEmail", "createdAt");
