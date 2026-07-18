# NexOrder AI - Background Cin7 Sync Fix

## Problem
Even after batching, Vercel still timed out:

```text
Vercel Runtime Timeout Error: Task timed out after 30 seconds
```

## Root cause
The client button was still trying to actively process the sync job through browser-triggered API calls.
On Vercel serverless this is not reliable for large product/customer syncs.

## Correct architecture
The button should only queue the job.
The cron worker should process the job in the background.

## What this pack changes

1. Client Refresh button now only queues a sync job.
2. Admin Refresh button now only queues a sync job.
3. No more long-running browser-triggered processing.
4. `/api/cron/cin7-sync` processes pending jobs in small safe batches.
5. Each cron execution processes only one job/page batch.
6. Page size is reduced to 20 records.
7. Cin7 Core API request timeout is reduced to 8 seconds.

## Important cron setup

Keep Gmail/Outlook existing cron:

```text
/api/cron/gmail-poll
Every 1 minute
```

Add or keep Cin7 Core worker cron:

```text
/api/cron/cin7-sync
Every 5 or 15 minutes
```

The endpoint does not create a new full refresh every 5/15 minutes.
It only processes:

```text
unfinished queued jobs
or clients due after 24 hours
```

## User-facing behavior after this fix

Client clicks:

```text
Queue Products & Customers Refresh
```

The app immediately responds:

```text
Cin7 refresh has been queued.
```

No endless spinner.
No Vercel timeout from manual click.

## Deploy

Replace these files:

```text
lib/cin7-sync-job.ts
app/settings/Cin7ConnectionSection.tsx
app/admin/AdminCin7SyncButton.tsx
README_BACKGROUND_CIN7_SYNC_FIX.md
```

Then run:

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant
git add .
git commit -m "Move Cin7 refresh to background cron queue"
git push origin main
npx vercel --prod
```
