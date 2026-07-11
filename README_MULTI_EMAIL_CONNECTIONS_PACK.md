# NexOrder AI - Multi Email Connections + Client Controls Pack

This pack adds:

1. Multiple Outlook connections per client.
2. Multiple Gmail connections per client.
3. Admin-controlled mailbox limits:
   - Outlook limit
   - Gmail limit
   - WhatsApp limit
4. Admin can activate/inactivate a client.
5. Admin can allow/block client from reconnecting/adding email inboxes.
6. Client input channels page shows connected mailboxes and remaining slots.
7. Outlook and Gmail OAuth callback stores separate connection rows instead of replacing the previous one.

## Required Vercel Environment Variables

### Outlook / Microsoft
```text
MICROSOFT_CLIENT_ID=your Microsoft app client id
MICROSOFT_CLIENT_SECRET=your Microsoft app client secret
MICROSOFT_REDIRECT_URI=https://YOUR-PRODUCTION-DOMAIN/api/outlook/callback
```

### Gmail / Google
```text
GOOGLE_CLIENT_ID=your Google OAuth client id
GOOGLE_CLIENT_SECRET=your Google OAuth client secret
GOOGLE_REDIRECT_URI=https://YOUR-PRODUCTION-DOMAIN/api/gmail/callback
```

## Push
```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant
git add .
git commit -m "Add multi mailbox connections and client controls"
git push
```
