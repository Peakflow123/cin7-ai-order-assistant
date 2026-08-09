# Exact Billing Navigation Fix

The previous script did not change anything because your active `components/ClientPortalFrame.tsx` uses this object order:

```ts
{ href: '/email', label: 'Channels' }
```

The earlier script searched for:

```ts
{ label: 'Channels', href: '/email' }
```

So the pattern did not match.

This patch adds Billing using the actual current file structure.

## Apply

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant
powershell -ExecutionPolicy Bypass -File add_billing_navigation_exact.ps1
```

## Verify before commit

```cmd
findstr /S /N /I "Billing /billing admin/billing" components\*.tsx app\admin\launch\*.tsx

git diff -- components\ClientPortalFrame.tsx app\admin\launch\AdminPortalShell.tsx
```

You should only see Billing lines added.

## Commit

```cmd
git add components\ClientPortalFrame.tsx
git add app\admin\launch\AdminPortalShell.tsx
git add add_billing_navigation_exact.ps1
git add README_EXACT_BILLING_NAV_FIX.md

git commit -m "Add billing links to actual navigation files"
git push origin main
```
