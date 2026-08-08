# NexOrder Billing Navigation Fix

This pack adds Billing to both client and admin navigation.

## Changes

- Client navigation now includes Billing:
  - Dashboard
  - Orders
  - Review Orders
  - Channels
  - Settings
  - Billing
  - Logout

- Admin Control Center navigation now includes Billing.
- `/admin/billing` now uses the same Admin Control Center shell instead of feeling like a separate old page.

## Deploy commands

Do not run `git add .`.

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant

git add components\ClientPortalFrame.tsx
git add app\admin\launch\AdminPortalShell.tsx
git add app\admin\billing\page.tsx
git add README_BILLING_NAVIGATION_FIX.md

git commit -m "Add billing links to client and admin navigation"
git push origin main
```

If Vercel auto-deploys from GitHub, use that. If CLI deploy works, you can run `npx vercel --prod`.
