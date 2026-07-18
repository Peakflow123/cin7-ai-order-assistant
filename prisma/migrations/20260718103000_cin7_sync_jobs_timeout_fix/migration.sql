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

CREATE TABLE IF NOT EXISTS "Cin7SyncJob" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "phase" TEXT NOT NULL DEFAULT 'products',
  "page" INTEGER NOT NULL DEFAULT 1,
  "mode" TEXT NOT NULL DEFAULT 'manual-client',
  "message" TEXT,
  "error" TEXT,
  "productsFetched" INTEGER NOT NULL DEFAULT 0,
  "productsCreated" INTEGER NOT NULL DEFAULT 0,
  "productsUpdated" INTEGER NOT NULL DEFAULT 0,
  "productsSkipped" INTEGER NOT NULL DEFAULT 0,
  "customersFetched" INTEGER NOT NULL DEFAULT 0,
  "customersCreated" INTEGER NOT NULL DEFAULT 0,
  "customersUpdated" INTEGER NOT NULL DEFAULT 0,
  "customersSkipped" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  CONSTRAINT "Cin7SyncJob_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Cin7SyncJob_companyId_status_idx" ON "Cin7SyncJob"("companyId", "status");
CREATE INDEX IF NOT EXISTS "Cin7SyncJob_status_updatedAt_idx" ON "Cin7SyncJob"("status", "updatedAt");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'IntegrationSyncState_companyId_fkey') THEN
    ALTER TABLE "IntegrationSyncState"
    ADD CONSTRAINT "IntegrationSyncState_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Cin7SyncJob_companyId_fkey') THEN
    ALTER TABLE "Cin7SyncJob"
    ADD CONSTRAINT "Cin7SyncJob_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
