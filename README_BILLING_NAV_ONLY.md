# Billing Navigation Only Patch

This patch only adds Billing links to navigation.

It does **not** replace layouts and does **not** touch:

- auth
- login
- Stripe logic
- billing logic
- Gmail
- Outlook
- Cin7
- database migrations
- client dashboard layout
- admin dashboard layout

## What it adds

Client navigation:

```text
Dashboard | Orders | Review Orders | Channels | Billing | Settings | Logout
```

Admin Control Center navigation:

```text
Control Center | Clients | Billing | Usage & Storage | Activity | Errors | Backups
```

## How to apply

From your project folder:

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant
powershell -ExecutionPolicy Bypass -File apply_billing_nav_only.ps1
```

Then verify changes:

```cmd
git diff -- components\ClientPortalFrame.tsx app\admin\launch\AdminPortalShell.tsx
```

Then commit only these files:

```cmd
git add components\ClientPortalFrame.tsx
git add app\admin\launch\AdminPortalShell.tsx
git add apply_billing_nav_only.ps1
git add README_BILLING_NAV_ONLY.md

git commit -m "Add billing links to navigation only"
git push origin main
```

If Vercel auto-deploys from GitHub, use that deployment.
