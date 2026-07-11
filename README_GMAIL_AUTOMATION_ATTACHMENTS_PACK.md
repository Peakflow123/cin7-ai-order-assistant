# NexOrder AI - Gmail Automation + Attachments + Filters Pack

This pack adds the requested upgrades:

1. Gmail attachment reading:
   - PDF
   - XLS/XLSX
   - DOCX
   - TXT/CSV
   - Image attachments are detected and flagged, OCR comes later.
2. AI email classification:
   - ORDER
   - NOT_ORDER
   - UNCLEAR
3. Gmail inbox page now hides emails that AI confidently marks as NOT_ORDER by default.
4. Manual option to include non-order emails and process anyway.
5. Automated Gmail polling using Vercel Cron every 10 minutes.
6. Duplicate message processing protection.
7. Orders list filters:
   - source/channel: manual-email, gmail, outlook, whatsapp
   - connected mailbox/account.
8. Orders now store sourceConnectionId and sourceAccount.

## New dependency packages
The package.json adds:

- pdf-parse
- mammoth
- xlsx

## Required environment variable for cron security
Add this in Vercel:

```text
CRON_SECRET=use-any-long-random-string
```

Vercel Cron sends this as Authorization Bearer token when invoking the cron route.

## Vercel Cron
This pack adds vercel.json:

```json
{
  "crons": [
    { "path": "/api/cron/gmail-poll", "schedule": "*/10 * * * *" }
  ]
}
```

## Deploy
Copy all files into your project and replace existing files, then push:

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant
git add .
git commit -m "Add Gmail automation attachments and order filters"
git push
```

## Test
1. Send a text order email to connected Gmail.
2. Send an order email with PDF/XLSX/DOCX/TXT attachment.
3. Open Input Channels > Load Gmail Orders.
4. Confirm only order-like emails appear by default.
5. Process email and review created order.
6. Check Orders page filters by Gmail and mailbox.
7. Wait for cron or manually open /api/cron/gmail-poll with CRON_SECRET header to test automated polling.
