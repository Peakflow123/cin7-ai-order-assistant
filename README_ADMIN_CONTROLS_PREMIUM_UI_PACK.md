# NexOrder AI - Admin Controls + Premium UI Pack

This pack restores the important admin controls and improves the visual layout.

## Admin controls added back

On `/admin`, the platform admin can now control each client:

- Client active / inactive
- Auto-create Cin7 enabled / disabled
- Auto-create threshold
- Allow client to edit Cin7 settings
- Allow client to reconnect email
- Maximum Gmail connections
- Maximum Outlook connections

These controls are saved through:

```text
PATCH /api/admin/companies/[id]
```

## UI improvements

- Cleaner navigation
- Separate client workspace and admin dashboard
- Better dashboard hierarchy
- More polished cards, stats and forms
- Less cluttered text
- Stronger blue/teal SaaS-style palette
- Admin sidebar with Client Controls section

## WhatsApp status

WhatsApp remains disabled and hidden from the active UI.
The app still keeps generic order source fields so WhatsApp, Telegram or other channels can be implemented later without redesigning Orders.

## Deploy

Copy files into your existing project and replace files, then run:

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant
git add .
git commit -m "Restore admin client controls and improve UI layout"
git push origin main
npx vercel --prod
```

## Test after deployment

1. Login as admin.
2. Confirm you land on `/admin`.
3. Change a client's Gmail/Outlook limits.
4. Save controls.
5. Open Channels as client and confirm the limit is respected.
6. Disable a client and confirm status changes in the admin panel.
