# NexOrder AI - Email Connection Reconnect and Removal Fix

## What this fixes

1. Gmail/Outlook connect now respects actual admin limits:

```text
maxGmailConnections
maxOutlookConnections
allowClientReconnectEmail
```

2. If a client has limit 3, they can connect up to 3 active Gmail or Outlook mailboxes.

3. The incorrect message:

```text
Outlook reconnect is disabled by admin
```

should no longer appear when admin allows reconnect/additional email connections.

4. Clients can now remove an existing Gmail or Outlook connection from the Channels page.

5. Removed connections are deactivated, not physically deleted. They disappear from the client Channels page and no longer count against the active connection limit.

6. `invalid_grant` is usually caused by a revoked/expired Google refresh token. The practical fix is now available: remove the old Gmail connection and reconnect the mailbox.

## Files changed

```text
app/api/gmail/connect/route.ts
app/api/outlook/connect/route.ts
app/api/gmail/connections/[id]/route.ts
app/api/outlook/connections/[id]/route.ts
app/email/page.tsx
README_EMAIL_CONNECTIONS_RECONNECT_FIX.md
```

## Deploy safely

Do not run `git add .`.

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant

git add app\api\gmail\connect\route.ts
git add app\api\outlook\connect\route.ts
git add "app\api\gmail\connections\[id]\route.ts"
git add "app\api\outlook\connections\[id]\route.ts"
git add app\email\page.tsx
git add README_EMAIL_CONNECTIONS_RECONNECT_FIX.md

git commit -m "Fix email reconnect limits and add remove connection"
git push origin main
npx vercel --prod
```

## Test checklist

1. Admin portal: set Gmail limit = 3, Outlook limit = 3, Client can reconnect email = Allowed.
2. Client Channels page should show `1/3`, `2/3`, etc.
3. Client should be able to connect a second Gmail/Outlook account.
4. Client should be able to remove an existing Gmail/Outlook connection.
5. If Gmail load shows `invalid_grant`, remove that Gmail connection and reconnect it.
