# NexOrder AI - Cin7 Sync Timeout and Credential Lock Fix

## Problem
Manual refresh was timing out on Vercel:

```text
Vercel Runtime Timeout Error: Task timed out after 60 seconds
```

This happened because product/customer refresh tried to finish everything inside one serverless function.

## Fix
This pack changes refresh to a small-batch job system:

1. User/admin clicks Refresh Products & Customers.
2. App creates a `Cin7SyncJob`.
3. Browser processes the job one page at a time through short requests.
4. Each request processes only 100 records/page.
5. If Cin7 rate limits the app, the job pauses and shows the error/wait message.
6. The UI no longer spins forever.

## Included changes

### 1. Hidden Base URL
Base URL is no longer visible to client or admin.
The app uses this internally:

```text
https://inventory.dearsystems.com/ExternalApi/v2
```

### 2. First-time setup allowed
Client can save:

```text
Cin7 Account ID
Cin7 API Key
```

### 3. Credentials locked after first save
After first setup, client cannot edit credentials unless admin enables:

```text
Allow client to edit Cin7 settings
```

### 4. One refresh button
Client/admin only see:

```text
Refresh Products & Customers
```

No Full Refresh button.

### 5. Admin refresh per client
Admin can refresh from:

```text
/admin/clients
```

### 6. Automatic 24-hour sync
Cron endpoint:

```text
/api/cron/cin7-sync
```

Important recommendation: schedule this every 15 minutes in cron-job.org. The endpoint itself only picks clients due for 24-hour sync, but frequent calls let large clients finish in safe batches without Vercel timeout.

Header:

```text
Authorization: Bearer YOUR_CRON_SECRET
```

## Deploy

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant
git add .
git commit -m "Fix Cin7 sync timeout and credential lock"
git push origin main
npx vercel --prod
```

## Test

1. Login as client.
2. Open `/settings`.
3. Confirm Base URL is not visible.
4. Save Cin7 Account ID and API Key if not connected.
5. Refresh page and confirm credentials are locked.
6. Click `Refresh Products & Customers`.
7. Confirm progress appears and page does not spin forever.
8. Login as admin.
9. Open `/admin/clients`.
10. Click client refresh.
