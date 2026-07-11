ALTER TABLE "GmailConnection" ADD COLUMN IF NOT EXISTS "lastCheckedAt" TIMESTAMP(3);
ALTER TABLE "OutlookConnection" ADD COLUMN IF NOT EXISTS "lastCheckedAt" TIMESTAMP(3);

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "sourceConnectionId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "sourceAccount" TEXT;

CREATE INDEX IF NOT EXISTS "Order_companyId_source_idx" ON "Order"("companyId", "source");
CREATE INDEX IF NOT EXISTS "Order_companyId_sourceConnectionId_idx" ON "Order"("companyId", "sourceConnectionId");
CREATE INDEX IF NOT EXISTS "Order_companyId_sourceMessageId_idx" ON "Order"("companyId", "sourceMessageId");
