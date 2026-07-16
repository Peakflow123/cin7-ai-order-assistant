# NexOrder AI - Outlook + WhatsApp Upgrade Pack

This pack adds:

1. Outlook inbox functionality:
   - Load recent Outlook emails
   - AI classification ORDER / NOT_ORDER / UNCLEAR
   - Process Outlook email into review order
   - Outlook PDF/Excel/DOCX/TXT attachment parsing
   - Duplicate prevention

2. External cron endpoint now checks both:
   - Gmail
   - Outlook

   Existing cron-job.org URL remains the same:

```text
/api/cron/gmail-poll
```

3. WhatsApp Cloud API preparation:
   - WhatsApp connection model
   - WhatsApp settings form on Input Channels page
   - Meta webhook verification route
   - Inbound WhatsApp text/button/interactive messages can create review orders
   - Document/image media is detected, media download/OCR can be next phase

4. Input Channels page updated:
   - Outlook card and inbox test section
   - Gmail remains active
   - WhatsApp settings section

## Required Microsoft settings
Outlook uses the Microsoft app already created:

```text
MICROSOFT_CLIENT_ID
MICROSOFT_CLIENT_SECRET
MICROSOFT_REDIRECT_URI
```

The Microsoft app needs delegated Mail.Read permission because the app reads messages and attachments.

## WhatsApp setup after deploy

In NexOrder AI > Input Channels > WhatsApp Setup, save:

```text
Display phone number
Meta Phone Number ID
WhatsApp Business Account ID
Webhook Verify Token
Access Token optional for this first inbound-text phase
```

Then in Meta Developer WhatsApp App, set webhook callback URL:

```text
https://YOUR-DOMAIN/api/whatsapp/webhook
```

Use the same verify token and subscribe to messages webhook events.

## Deploy

Copy files into your project and replace files, then run:

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant
git add .
git commit -m "Add Outlook and WhatsApp order channels"
git push origin main
npx vercel --prod
```

## Test Outlook

1. Connect Outlook on Input Channels.
2. Load Outlook Orders.
3. Process one Outlook order email.
4. Confirm review order is created.

## Test WhatsApp

1. Save WhatsApp settings in NexOrder AI.
2. Configure Meta webhook callback URL and verify token.
3. Send a message like:

```text
Customer: Test Customer
PO: WA-001
5 boxes SKU-123
```

4. Confirm order appears in Orders.
