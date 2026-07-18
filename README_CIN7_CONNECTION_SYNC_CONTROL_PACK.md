# NexOrder AI - Cin7 Connection Sync Control Pack

## What this pack changes

### 1. Better client-side Settings structure
The client Settings page now has:

1. Security Session
2. Cin7 Connection

The Cin7 section is directly on `/settings`. There is no separate visible `/settings/cin7` page anymore.

### 2. First-time Cin7 setup is allowed
If the client has no Cin7 connection yet, the client can enter:

```text
Cin7 Account ID
Cin7 API Key
Base URL
```

and save the connection.

### 3. After first save, editing is locked
After the client saves the Cin7 connection the first time, the fields are locked unless the admin allows editing by enabling:

```text
Allow client to edit Cin7 settings
```

in admin client controls.

### 4. One clear refresh button
The client sees only one button:

```text
Refresh Products & Customers
```

No separate "Full Refresh" button is shown to avoid confusion.

### 5. Admin refresh button
The admin can refresh products/customers for a specific client from:

```text
/admin/clients
```

### 6. Automatic 24-hour refresh
New endpoint:

```text
/api/cron/cin7-sync
```

Set this in cron-job.org once per day with header:

```text
Authorization: Bearer YOUR_CRON_SECRET
```

### 7. No duplicates
The sync uses upsert by:

```text
companyId + cin7Id
```

So existing products/customers are updated, not duplicated.

### 8. Incremental update behavior
The sync stores last sync timestamps in:

```text
IntegrationSyncState
```

It attempts to request/skip only changed records. If Cin7 returns full data anyway, the local upsert prevents duplicates and unchanged items are skipped where LastModified data is available.

## Refresh vs Full Refresh explanation

The previous pack had two buttons:

- Refresh: intended to update only changed/new products and customers after the last sync.
- Full Refresh: intended to re-check the full Cin7 product/customer list.

This new pack removes the client Full Refresh button because it is confusing and could be slow for large clients.

## Deploy

Copy files into your project and replace files, then run:

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant
git add .
git commit -m "Refine Cin7 setup locking and sync controls"
git push origin main
npx vercel --prod
```

## Test

1. Login as a client with no Cin7 connection.
2. Open `/settings`.
3. Save Cin7 Account ID and API Key.
4. Refresh the page.
5. Confirm the Cin7 fields are locked.
6. Confirm the Refresh Products & Customers button is still available.
7. Login as admin.
8. Open `/admin/clients`.
9. Confirm the Refresh Products & Customers button is available for clients with Cin7 connection.
