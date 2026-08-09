# NexOrder Layout Repair After Billing Navigation

This fixes the broken layout caused by the previous navigation update.

## What changed

- ClientPortalFrame no longer renders a second desktop header.
- ClientPortalFrame keeps the mobile header and bottom navigation.
- AdminPortalShell uses direct Tailwind classes and an N mark, not the wrong logo file.
- Billing remains in navigation.

## What this does not touch

- No auth changes.
- No billing logic changes.
- No Stripe changes.
- No Gmail/Outlook/Cin7 changes.
- No database changes.

## Deploy

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant

git add components\ClientPortalFrame.tsx
git add app\admin\launch\AdminPortalShell.tsx
git add README_LAYOUT_REPAIR_AFTER_BILLING_NAV.md

git commit -m "Repair layout after billing navigation update"
git push origin main
```
