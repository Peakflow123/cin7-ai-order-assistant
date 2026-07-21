# NexOrder AI - Launch Readiness Safe Pack

This is a safer rework of the seven launch-readiness improvements.

## Very important

This pack does **not** replace or modify `lib/auth.ts` and does **not** include admin impersonation.

Admin impersonation was the risky part that caused auth/session issues earlier. It can be added later only after checking the current auth implementation.

## Included now

1. Launch Control Center

```text
/admin/launch
```

2. Usage & Storage

```text
/admin/launch/usage
```

3. Client lifecycle controls

```text
/admin/launch/clients
```

Includes:

- Active/inactive
- Archive/unarchive
- Plan name
- Gmail limit
- Outlook limit
- Monthly order limit
- Permanent delete protected by typing DELETE

4. Activity monitoring

```text
/admin/launch/activity
```

5. Error monitoring

```text
/admin/launch/errors
```

6. Backups/recovery checklist

```text
/admin/launch/backups
```

7. Client onboarding checklist

```text
/onboarding
```

## Deploy safely

Do not run `git add .`.

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant

git add prisma\migrations\20260721012000_launch_readiness_safe\migration.sql
git add lib\admin-launch-safe.ts
git add app\admin\launch\page.tsx
git add app\admin\launch\clients\page.tsx
git add app\admin\launch\usage\page.tsx
git add app\admin\launch\activity\page.tsx
git add app\admin\launch\errors\page.tsx
git add app\admin\launch\backups\page.tsx
git add app\onboarding\page.tsx
git add app\api\admin\launch\client-controls\route.ts
git add app\api\admin\launch\delete-client\route.ts
git add README_LAUNCH_READINESS_SAFE_PACK.md

git commit -m "Add safe launch readiness admin tools"
git push origin main
npx vercel --prod
```

## Test checklist

1. Admin login still works.
2. Open `/admin/launch`.
3. Open `/admin/launch/usage`.
4. Open `/admin/launch/clients`.
5. Save one test client setting.
6. Open `/admin/launch/activity`.
7. Client opens `/onboarding`.

## Not included intentionally

```text
Admin impersonate client
```

Reason: it touches auth/session logic and should not be included in this safe pack.
