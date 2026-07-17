ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sessionTimeoutMinutes" INTEGER NOT NULL DEFAULT 720;

-- Keep registered emails globally unique. This should already exist from schema, but this keeps older databases safe.
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- Keep WhatsApp disabled while preserving future extensibility through generic Order.source fields.
ALTER TABLE "Company" ALTER COLUMN "maxWhatsappConnections" SET DEFAULT 0;
UPDATE "Company" SET "maxWhatsappConnections" = 0;
