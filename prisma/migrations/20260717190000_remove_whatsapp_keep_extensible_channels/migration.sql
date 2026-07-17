-- Remove active WhatsApp functionality for now.
-- Future channel expansion remains easy because Order.source, sourceConnectionId and sourceAccount are generic.
DROP TABLE IF EXISTS "WhatsappConnection";

-- Keep companies technically extensible, but default WhatsApp capacity is zero until we re-enable it later.
ALTER TABLE "Company" ALTER COLUMN "maxWhatsappConnections" SET DEFAULT 0;
UPDATE "Company" SET "maxWhatsappConnections" = 0;
