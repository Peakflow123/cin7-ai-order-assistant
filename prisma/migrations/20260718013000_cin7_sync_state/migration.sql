CREATE TABLE IF NOT EXISTS "IntegrationSyncState" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "productsLastSyncedAt" TIMESTAMP(3),
  "customersLastSyncedAt" TIMESTAMP(3),
  "lastSyncStatus" TEXT,
  "lastSyncMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IntegrationSyncState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "IntegrationSyncState_companyId_key" ON "IntegrationSyncState"("companyId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'IntegrationSyncState_companyId_fkey') THEN
    ALTER TABLE "IntegrationSyncState"
    ADD CONSTRAINT "IntegrationSyncState_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
