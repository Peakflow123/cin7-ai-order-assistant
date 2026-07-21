-- NexOrder AI Launch Readiness Safe Pack
-- Additive only. No auth/session changes.

ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "isArchived" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "planName" TEXT NOT NULL DEFAULT 'Starter';
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "monthlyOrderLimit" INTEGER;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP(3);
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "adminNotes" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "lastAdminActivityAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "SystemLog" (
  "id" TEXT PRIMARY KEY,
  "companyId" TEXT,
  "level" TEXT NOT NULL DEFAULT 'INFO',
  "source" TEXT NOT NULL DEFAULT 'system',
  "message" TEXT NOT NULL,
  "details" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "SystemLog_company_created_idx" ON "SystemLog"("companyId", "createdAt");
CREATE INDEX IF NOT EXISTS "SystemLog_level_created_idx" ON "SystemLog"("level", "createdAt");

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

CREATE TABLE IF NOT EXISTS "OrderAudit" (
  "id" TEXT PRIMARY KEY,
  "companyId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "actorUserId" TEXT,
  "actorEmail" TEXT,
  "action" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "details" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "OrderAudit_order_created_idx" ON "OrderAudit"("orderId", "createdAt");
CREATE INDEX IF NOT EXISTS "OrderAudit_company_created_idx" ON "OrderAudit"("companyId", "createdAt");
