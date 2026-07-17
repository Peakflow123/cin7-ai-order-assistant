# NexOrder AI - Clean Gmail/Outlook, Admin Dashboard and UI Pack

This pack removes active WhatsApp functionality and refocuses NexOrder AI on launch-ready Gmail + Outlook processing.

## What this pack does

1. Removes WhatsApp from the visible app UI:
   - Channels page now shows only Gmail and Outlook.
   - WhatsApp setup form is removed.

2. Disables WhatsApp API endpoints:
   - `/api/whatsapp/webhook` returns 410 disabled.
   - `/api/whatsapp/settings` returns 410 disabled.

3. Removes WhatsApp data table:
   - Migration drops `WhatsappConnection`.
   - Company default `maxWhatsappConnections` becomes `0`.

4. Keeps the app future-extensible:
   - `Order.source`, `sourceConnectionId`, and `sourceAccount` remain generic strings.
   - This means WhatsApp, Telegram, EDI, portals or other platforms can be added later without redesigning Orders.
   - Gmail and Outlook remain implemented as channel-specific connection tables.

5. Improves navigation and separation:
   - Client users go to `/dashboard` for client work.
   - Admin users are redirected to `/admin`.
   - Admin dashboard is separate from client dashboard.

6. Adds a cleaner admin dashboard:
   - Client overview
   - Total orders
   - Needs review
   - Created orders
   - Error count
   - Gmail and Outlook connection counts
   - Feedback count

7. Improves UI cleanliness:
   - Cleaner colors
   - Less visual clutter
   - More consistent cards/buttons/badges
   - Better dashboard structure

## Deploy

Copy files into your existing project and replace files.

Then run:

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant
git add .
git commit -m "Remove WhatsApp and improve admin navigation UI"
git push origin main
npx vercel --prod
```

## Important after deploy

Because this pack drops the WhatsApp table, existing saved WhatsApp connections will be removed. Gmail and Outlook are not affected.

## Future channel strategy

When you are ready to add WhatsApp or Telegram later, we should add a generic channel framework:

- `ChannelConnection`
- `ChannelMessage`
- per-channel adapters, for example GmailAdapter, OutlookAdapter, WhatsAppAdapter, TelegramAdapter

For now, this pack keeps current robust Gmail + Outlook code while preserving generic order source fields for future expansion.
