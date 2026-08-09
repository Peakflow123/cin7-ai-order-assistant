# Billing Navigation Line Patch

This is a safer patch. It does **not** replace layout files. It inserts one Billing line into the existing files.

## It changes only

- `components/ClientPortalFrame.tsx`
- `app/admin/launch/AdminPortalShell.tsx`

## It does not touch

- auth/login
- Stripe logic
- billing logic
- Gmail
- Outlook
- Cin7
- database
- dashboard layout
- admin layout

## Apply

Copy these two files into the project root:

- `add_billing_nav_line_patch.ps1`
- `README_BILLING_NAV_LINE_PATCH.md`

Then run:

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant
powershell -ExecutionPolicy Bypass -File add_billing_nav_line_patch.ps1
```

Verify:

```cmd
findstr /N /I billing components\ClientPortalFrame.tsx
findstr /N /I billing app\admin\launch\AdminPortalShell.tsx
git diff -- components\ClientPortalFrame.tsx app\admin\launch\AdminPortalShell.tsx
```

Commit:

```cmd
git add components\ClientPortalFrame.tsx
git add app\admin\launch\AdminPortalShell.tsx
git add add_billing_nav_line_patch.ps1
git add README_BILLING_NAV_LINE_PATCH.md

git commit -m "Add billing to existing navigation"
git push origin main
```
