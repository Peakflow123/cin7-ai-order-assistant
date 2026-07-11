ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'CLIENT';

ALTER TABLE "ProductAlias" ADD COLUMN IF NOT EXISTS "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1;
ALTER TABLE "ProductAlias" ADD COLUMN IF NOT EXISTS "timesUsed" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "ProductAlias" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS "CustomerAlias" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "rawText" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "timesUsed" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CustomerAlias_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CustomerAlias_companyId_rawText_key" ON "CustomerAlias"("companyId", "rawText");
CREATE INDEX IF NOT EXISTS "CustomerAlias_companyId_customerId_idx" ON "CustomerAlias"("companyId", "customerId");
CREATE INDEX IF NOT EXISTS "Customer_email_idx" ON "Customer"("companyId", "email");
CREATE INDEX IF NOT EXISTS "Order_companyId_customerId_idx" ON "Order"("companyId", "customerId");
CREATE INDEX IF NOT EXISTS "Order_companyId_status_idx" ON "Order"("companyId", "status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CustomerAlias_companyId_fkey'
  ) THEN
    ALTER TABLE "CustomerAlias"
    ADD CONSTRAINT "CustomerAlias_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
