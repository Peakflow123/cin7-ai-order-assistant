-- Dedupe engine: additive columns on Order
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "internetMessageId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "threadId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "normalizedPo" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "contentHash" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "possibleDuplicate" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "duplicateReason" TEXT;

CREATE INDEX IF NOT EXISTS "Order_companyId_internetMessageId_idx" ON "Order" ("companyId", "internetMessageId");
CREATE INDEX IF NOT EXISTS "Order_companyId_threadId_idx" ON "Order" ("companyId", "threadId");
CREATE INDEX IF NOT EXISTS "Order_companyId_normalizedPo_idx" ON "Order" ("companyId", "normalizedPo");
