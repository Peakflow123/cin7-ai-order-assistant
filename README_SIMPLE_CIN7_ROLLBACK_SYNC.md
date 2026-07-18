# NexOrder AI - Simple Cin7 Core Sync Rollback Pack

This pack removes the over-complex job/queue refresh behavior and puts the Cin7 setup back into a simple working structure.

## What this does

### 1. Client Settings
Client goes to:

```text
/settings
```

Client sees:

```text
Security Session
Cin7 Connection
```

### 2. First-time setup
Client enters only:

```text
Cin7 Account ID
Cin7 API Key
```

Base URL is hidden and handled in code:

```text
https://inventory.dearsystems.com/ExternalApi/v2
```

### 3. Lock after first save
After first connection is saved, client cannot edit credentials unless admin allows:

```text
Allow client to edit Cin7 settings
```

### 4. Manual refresh
Client has:

```text
Refresh Products & Customers
```

Admin also has the refresh button on:

```text
/admin/clients
```

### 5. 24-hour automatic refresh
Cron endpoint:

```text
/api/cron/cin7-sync
```

This checks active clients and only syncs if last sync is older than 24 hours.

### 6. No duplicates
Products/customers are saved by:

```text
companyId + cin7Id
```

Existing records are updated, new records are created.

## Files replaced/added

```text
lib/cin7-simple-sync.ts
app/api/settings/cin7/refresh/route.ts
app/api/admin/companies/[id]/cin7-refresh/route.ts
app/api/cron/cin7-sync/route.ts
app/settings/Cin7ConnectionSection.tsx
app/settings/page.tsx
app/settings/cin7/page.tsx
app/admin/AdminCin7SyncButton.tsx
app/admin/clients/page.tsx
```

## Deploy

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant
git add .
git commit -m "Rollback Cin7 Core sync to simple refresh flow"
git push origin main
npx vercel --prod
```

## Important cron setup

Keep Gmail/Outlook cron every 1 minute.

For Cin7 Core automatic sync, use:

```text
/api/cron/cin7-sync
Every 24 hours
```

or every few hours if you want it to check more often. The code itself only syncs clients due after 24 hours.
