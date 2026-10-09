ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "inboundEmailToken" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "inboundEmailEnabled" BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "inboundEmailAllowedSenders" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Company_inboundEmailToken_key" ON "Company"("inboundEmailToken");

UPDATE "Company"
SET "inboundEmailToken" = substr(md5(random()::text || clock_timestamp()::text || "id"), 1, 24)
WHERE "inboundEmailToken" IS NULL;
