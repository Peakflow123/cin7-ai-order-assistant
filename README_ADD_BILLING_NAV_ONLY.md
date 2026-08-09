# Add Billing Navigation Only

This package does not replace layout files. It runs a small script that only inserts Billing links into the existing navigation arrays.

## It changes only

- `components/ClientPortalFrame.tsx`
- `app/admin/launch/AdminPortalShell.tsx`

## It does not touch

- auth/login
- Stripe/billing logic
- Gmail/Outlook/Cin7
- dashboard layout
- admin page layout
- database/migrations

## Apply

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant
powershell -ExecutionPolicy Bypass -File add_billing_navigation_only.ps1
```

Review the result:

```cmd
git diff -- components\ClientPortalFrame.tsx app\admin\launch\AdminPortalShell.tsx
```

Commit only these files:

```cmd
git add components\ClientPortalFrame.tsx
git add app\admin\launch\AdminPortalShell.tsx
git add add_billing_navigation_only.ps1
git add README_ADD_BILLING_NAV_ONLY.md

git commit -m "Add billing links to existing navigation only"
git push origin main
```

Then let Vercel auto-deploy from GitHub.
