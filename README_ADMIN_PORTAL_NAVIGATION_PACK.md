# NexOrder AI - Admin Portal Navigation Pack

## Purpose

This improves the safe launch readiness upgrade by making `/admin/launch` a proper admin portal instead of scattered pages.

## What changes

- Adds reusable Admin Portal shell/navigation.
- Makes `/admin/launch` a clean command center.
- Adds sidebar navigation on desktop.
- Adds top navigation buttons on smaller screens.
- Keeps old `/admin` page available as `Classic Admin`.
- Does not touch authentication.
- Does not touch Gmail, Outlook, Cin7 or client flows.

## Files changed

```text
app/admin/launch/AdminPortalShell.tsx
app/admin/launch/page.tsx
app/admin/launch/clients/page.tsx
app/admin/launch/usage/page.tsx
app/admin/launch/activity/page.tsx
app/admin/launch/errors/page.tsx
app/admin/launch/backups/page.tsx
README_ADMIN_PORTAL_NAVIGATION_PACK.md
```

## Deploy safely

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant

git add app\admin\launch\AdminPortalShell.tsx
git add app\admin\launch\page.tsx
git add app\admin\launch\clients\page.tsx
git add app\admin\launch\usage\page.tsx
git add app\admin\launch\activity\page.tsx
git add app\admin\launch\errors\page.tsx
git add app\admin\launch\backups\page.tsx
git add README_ADMIN_PORTAL_NAVIGATION_PACK.md

git commit -m "Improve admin launch portal navigation"
git push origin main
npx vercel --prod
```

Do not use `git add .`.
