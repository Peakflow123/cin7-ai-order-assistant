ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "allowClientEmailReconnect" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "maxOutlookConnections" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "maxGmailConnections" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "maxWhatsappConnections" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "OutlookConnection" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "OutlookConnection" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "GmailConnection" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "GmailConnection" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

DROP INDEX IF EXISTS "OutlookConnection_companyId_key";
DROP INDEX IF EXISTS "GmailConnection_companyId_key";

CREATE INDEX IF NOT EXISTS "OutlookConnection_companyId_idx" ON "OutlookConnection"("companyId");
CREATE INDEX IF NOT EXISTS "OutlookConnection_companyId_isActive_idx" ON "OutlookConnection"("companyId", "isActive");
CREATE INDEX IF NOT EXISTS "GmailConnection_companyId_idx" ON "GmailConnection"("companyId");
CREATE INDEX IF NOT EXISTS "GmailConnection_companyId_isActive_idx" ON "GmailConnection"("companyId", "isActive");
