CREATE TABLE IF NOT EXISTS "OrderFeedback" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "feedbackType" TEXT NOT NULL,
  "comment" TEXT,
  "source" TEXT,
  "sourceAccount" TEXT,
  "sender" TEXT,
  "subject" TEXT,
  "originalText" TEXT,
  "sourceMessageId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderFeedback_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "OrderFeedback_companyId_feedbackType_idx" ON "OrderFeedback"("companyId", "feedbackType");
CREATE INDEX IF NOT EXISTS "OrderFeedback_companyId_source_idx" ON "OrderFeedback"("companyId", "source");
CREATE INDEX IF NOT EXISTS "OrderFeedback_companyId_createdAt_idx" ON "OrderFeedback"("companyId", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'OrderFeedback_companyId_fkey'
  ) THEN
    ALTER TABLE "OrderFeedback"
    ADD CONSTRAINT "OrderFeedback_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
