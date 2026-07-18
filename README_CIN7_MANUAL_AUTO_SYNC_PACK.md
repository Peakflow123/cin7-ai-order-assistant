# NexOrder AI - Cin7 Manual/Admin/24h Auto Sync Pack

This pack adds the Cin7 sync improvements requested.

## What is included

### 1. Client manual refresh button
On:

```text
/settings/cin7
```

The client can now run:

```text
Refresh Products & Customers
Full Refresh
```

### 2. Admin manual refresh per client
On:

```text
/admin/clients
```

The admin can refresh products/customers for any specific client that has a Cin7 connection.

### 3. Automatic 24-hour refresh
New endpoint:

```text
/api/cron/cin7-sync
```

Use this with cron-job.org once per day.

Header:

```text
Authorization: Bearer YOUR_CRON_SECRET
```

### 4. No duplicate products/customers
The sync uses Prisma `upsert` by:

```text
companyId + cin7Id
```

So if a product/customer already exists, it updates it. If not, it creates it.

### 5. Incremental-safe behavior
The system stores last sync time in:

```text
IntegrationSyncState
```

When possible, it uses last modified timestamps from Cin7 data to skip unchanged records. If Cin7 does not honor date filters on a tenant/API endpoint, the local upsert still prevents duplicates.

## Important note
Cin7 Core API endpoints and response shapes can vary by entity and tenant. This implementation tries common Cin7 Core endpoints for Products and Customers and normalizes common response shapes.

## Deploy

Copy files into your project and replace files, then run:

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant
git add .
git commit -m "Add Cin7 manual admin and daily sync"
git push origin main
npx vercel --prod
```

## After deploy

1. Login as client.
2. Open `/settings/cin7`.
3. Click `Refresh Products & Customers`.
4. Login as admin.
5. Open `/admin/clients`.
6. Click `Refresh Cin7` for a specific client.
7. In cron-job.org add daily job for:

```text
https://cin7-ai-order-assistant-three.vercel.app/api/cron/cin7-sync
```

with authorization header:

```text
Bearer YOUR_CRON_SECRET
```
