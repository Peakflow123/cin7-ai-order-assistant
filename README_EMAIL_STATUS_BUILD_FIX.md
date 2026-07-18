# NexOrder AI - Email Status Build Fix

## Error fixed

Deployment failed with:

```text
status does not exist in type GmailConnectionSelect
```

## Cause

The current Prisma `gmailConnection` and/or `outlookConnection` model does not have a `status` column.

## Fix

Removed `status: true` from the Prisma select and added a derived frontend-safe value:

```ts
status: 'Active'
```

## Deploy

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant

git add app\api\gmail\recent\route.ts
git add app\api\outlook\recent\route.ts
git add README_EMAIL_STATUS_BUILD_FIX.md

git commit -m "Fix email recent routes connection status select"
git push origin main
npx vercel --prod
```
