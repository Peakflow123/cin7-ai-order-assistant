# Corrected Billing Navigation Pack

This is not a rollback. It fixes the previous billing navigation files properly.

## What it does

- Keeps Billing in client navigation.
- Keeps Billing in admin Control Center navigation.
- Fixes admin layout using direct Tailwind classes instead of missing custom CSS classes.
- Keeps `/admin/billing` inside the Control Center layout.

## What it does not touch

- No auth changes.
- No Stripe logic changes.
- No billing database changes.
- No Gmail, Outlook, Cin7 changes.
- No client functionality changes.

## Deploy

Do not run `git add .`.

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant

git add components\ClientPortalFrame.tsx
git add app\admin\launch\AdminPortalShell.tsx
git add app\admin\billing\page.tsx
git add README_BILLING_NAV_CORRECTED.md

git commit -m "Correct billing navigation and admin layout"
git push origin main
```
