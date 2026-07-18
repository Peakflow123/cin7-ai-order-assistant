# NexOrder AI - Final Clean Cin7 Page-by-Page Sync Reset

This pack resets only the Cin7 product/customer sync area from scratch.

## Goal
Keep the user experience simple:

```text
Cin7 Account ID
Cin7 API Key
Save Connection
Refresh Products & Customers
```

But internally process the refresh in pages so Vercel does not timeout.

## What was removed/disabled

These old long-running endpoints are disabled:

```text
/api/settings/cin7/refresh
/api/admin/companies/[id]/cin7-refresh
/api/cron/cin7-sync
```

## What is used now

Client refresh uses:

```text
/api/settings/cin7/refresh-step
/api/settings/cin7/refresh-complete
```

Admin refresh uses:

```text
/api/admin/companies/[id]/cin7-refresh-step
/api/admin/companies/[id]/cin7-refresh-complete
```

## Important
After deployment, hard refresh the browser:

```text
Ctrl + Shift + R
```

If PWA cache causes issues, open DevTools -> Application -> Service Workers -> Unregister.

## Deploy

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant
git add .
git commit -m "Reset Cin7 sync to clean page by page flow"
git push origin main
npx vercel --prod
```
