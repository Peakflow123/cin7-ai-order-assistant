# NexOrder AI - Admin Control Center Complete Pack

## What this pack does

This consolidates the old admin functionality into the newer Admin Control Center and makes the new version the main admin entry point.

## Important

This pack does not modify `lib/auth.ts` and does not change login/session behavior.

## Included

1. `/admin` redirects to `/admin/launch`.
2. `/admin/clients` redirects to `/admin/launch/clients`.
3. New `/admin/launch/clients` includes:
   - Active/inactive
   - Archive/unarchive
   - Plan
   - Gmail connection limit
   - Outlook connection limit
   - Monthly order limit
   - Auto-create Cin7 on/off
   - Auto-create confidence threshold
   - Client can edit Cin7 settings on/off
   - Client can reconnect email on/off
   - Admin notes
   - Products/customers/orders/errors/feedback KPIs
   - Storage estimate
   - Permanent delete with DELETE confirmation
4. Client Cin7 API save route now enforces the admin setting:

```text
Client can edit Cin7 settings = Locked
```

If locked and a Cin7 connection already exists, the client cannot update credentials.

## Files changed

```text
prisma/migrations/20260725014500_admin_control_center_complete/migration.sql
lib/admin-control-center.ts
app/admin/page.tsx
app/admin/clients/page.tsx
app/admin/launch/AdminPortalShell.tsx
app/admin/launch/page.tsx
app/admin/launch/clients/page.tsx
app/api/admin/launch/client-controls/route.ts
app/api/settings/cin7/route.ts
README_ADMIN_CONTROL_CENTER_COMPLETE.md
```

## Deploy safely

Do not run `git add .`.

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant

git add prisma\migrations\20260725014500_admin_control_center_complete\migration.sql
git add lib\admin-control-center.ts
git add app\admin\page.tsx
git add app\admin\clients\page.tsx
git add app\admin\launch\AdminPortalShell.tsx
git add app\admin\launch\page.tsx
git add app\admin\launch\clients\page.tsx
git add app\api\admin\launch\client-controls\route.ts
git add app\api\settings\cin7\route.ts
git add README_ADMIN_CONTROL_CENTER_COMPLETE.md

git commit -m "Consolidate admin controls into launch control center"
git push origin main
npx vercel --prod
```

## Test checklist

1. Login as admin.
2. Open `/admin` and confirm it redirects to `/admin/launch`.
3. Open `/admin/clients` and confirm it redirects to `/admin/launch/clients`.
4. In `/admin/launch/clients`, set `Client can edit Cin7 settings` to `Locked` for a test client.
5. Login as that client and try to update Cin7 credentials.
6. Expected result: update is blocked, but refresh products/customers remains available.
