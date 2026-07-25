# NexOrder AI - Active Email Connection Limit Fix

## Problem

When a user connects and removes the same Gmail/Outlook mailbox several times, the system eventually thinks the connection limit is reached, even though only one mailbox is currently active.

## Root cause

The connect/callback flow can still be affected by historical inactive records. Limits must be based only on:

```text
isActive = true
```

Also, reconnecting the same mailbox should reuse/reactivate the existing inactive row instead of creating endless historical active-count issues.

## Fix included

1. Gmail connect checks only active Gmail connections.
2. Outlook connect checks only active Outlook connections.
3. Gmail callback reuses an existing same-email connection row and reactivates it.
4. Outlook callback reuses an existing same-email connection row and reactivates it.
5. Same-email reconnect does not count as a new active slot.
6. New active connections are blocked only when active connections have reached the client limit.

## Files changed

```text
app/api/gmail/connect/route.ts
app/api/outlook/connect/route.ts
app/api/gmail/callback/route.ts
app/api/outlook/callback/route.ts
README_ACTIVE_EMAIL_CONNECTION_LIMIT_FIX.md
```

## Deploy safely

Do not use `git add .`.

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant

git add app\api\gmail\connect\route.ts
git add app\api\outlook\connect\route.ts
git add app\api\gmail\callback\route.ts
git add app\api\outlook\callback\route.ts
git add README_ACTIVE_EMAIL_CONNECTION_LIMIT_FIX.md

git commit -m "Fix active email connection limit handling"
git push origin main
npx vercel --prod
```

## Test checklist

1. Admin sets Gmail limit = 2.
2. Client connects Gmail account A.
3. Client removes Gmail account A.
4. Client connects Gmail account A again.
5. Client removes Gmail account A again.
6. Client connects Gmail account A again.

Expected result:

```text
Allowed, because only currently active Gmail connections count.
```

Repeat same test for Outlook.
