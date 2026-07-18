# NexOrder AI - Cin7 Stuck Refresh Fix

## Problem
The refresh button stayed on:

```text
Refreshing...
Status: PENDING
Page: 1
```

for many minutes. Vercel logs showed the API route timing out.

## Cause
The browser was waiting for `/api/sync-jobs/[id]/run` to return. If that route timed out, the UI did not get a clean response, so the button stayed disabled and the job stayed visually stuck.

Also, the previous sync worker could try multiple endpoint fallbacks and wait too long before failing.

## Fixes in this pack

1. Each Cin7 Core request now has a 12-second server-side timeout.
2. Each browser call has a 25-second client-side timeout.
3. Page size reduced to 50 records per batch.
4. The sync route now fails fast and shows a clear message.
5. UI no longer spins forever if Vercel kills a request.
6. Sync uses Cin7 Core endpoint names:

```text
Product
Customer
```

7. User/admin can click refresh again after a failure instead of being stuck.

## Deploy

Copy these files into your project and replace existing files:

```text
lib/cin7-sync-job.ts
app/settings/Cin7ConnectionSection.tsx
app/admin/AdminCin7SyncButton.tsx
README_CIN7_STUCK_REFRESH_FIX.md
```

Then run:

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant
git add .
git commit -m "Fix Cin7 refresh stuck timeout handling"
git push origin main
npx vercel --prod
```

## After deployment test

1. Open `/settings` as client.
2. Click `Refresh Products & Customers`.
3. You should see either progress page-by-page or a clear error message within 25 seconds.
4. It should not stay stuck on PENDING forever.
5. If it errors, copy the visible message and the newest Vercel log.
