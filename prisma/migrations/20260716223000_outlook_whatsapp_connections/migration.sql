CREATE TABLE IF NOT EXISTS "WhatsappConnection" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "displayPhoneNumber" TEXT,
  "phoneNumberId" TEXT NOT NULL,
  "businessAccountId" TEXT,
  "accessTokenEncrypted" TEXT,
  "verifyToken" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WhatsappConnection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WhatsappConnection_companyId_phoneNumberId_key" ON "WhatsappConnection"("companyId", "phoneNumberId");
CREATE INDEX IF NOT EXISTS "WhatsappConnection_companyId_idx" ON "WhatsappConnection"("companyId");
CREATE INDEX IF NOT EXISTS "WhatsappConnection_companyId_isActive_idx" ON "WhatsappConnection"("companyId", "isActive");
CREATE INDEX IF NOT EXISTS "WhatsappConnection_phoneNumberId_idx" ON "WhatsappConnection"("phoneNumberId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WhatsappConnection_companyId_fkey') THEN
    ALTER TABLE "WhatsappConnection"
    ADD CONSTRAINT "WhatsappConnection_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
