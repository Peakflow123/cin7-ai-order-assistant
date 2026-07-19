# NexOrder AI - Fast Gmail/Outlook Load Pack

## Why loading was slow
The inbox load was running AI classification for every email. Outlook was also checking attachment names for each message. This makes the list load slow.

## What changed

1. Inbox now loads in **fast mode** by default.
2. AI classification is optional using a checkbox:

```text
Use AI classification on load
```

3. Full email body and attachments are still processed when the user clicks:

```text
Process Email
```

4. Outlook list no longer fetches attachment details for every item. It only shows that an attachment exists.

## Files changed

```text
app/email/GmailInboxClient.tsx
app/email/OutlookInboxClient.tsx
app/api/gmail/inbox/route.ts
app/api/outlook/inbox/route.ts
lib/gmail.ts
lib/outlook.ts
```

## Deploy safely

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant

git add app\email\GmailInboxClient.tsx
git add app\email\OutlookInboxClient.tsx
git add app\api\gmail\inbox\route.ts
git add app\api\outlook\inbox\route.ts
git add lib\gmail.ts
git add lib\outlook.ts
git add README_FAST_EMAIL_LOAD.md

git commit -m "Speed up Gmail and Outlook inbox loading"
git push origin main
npx vercel --prod
```
