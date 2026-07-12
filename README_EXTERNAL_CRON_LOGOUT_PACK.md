# NexOrder AI - External Cron + Logout Pack

This pack adds:

1. Logout route:
   - POST `/api/auth/logout`
   - GET `/api/auth/logout`
2. Logout button in the top navigation after login.
3. Secure Gmail polling endpoint:
   - GET `/api/cron/gmail-poll`
   - Requires `Authorization: Bearer YOUR_CRON_SECRET`
4. Removes Vercel internal frequent cron from `vercel.json` so deployment works on Vercel Hobby.

## Why external cron
Vercel Hobby does not allow frequent cron schedules. The app keeps `/api/cron/gmail-poll`, and an external scheduler such as cron-job.org can call this URL every 2 minutes.

## Vercel Environment Variable
Add this in Vercel:

```text
CRON_SECRET=your-long-random-secret
```

Example:

```text
CRON_SECRET=nexorder-ai-cron-secret-2026-long-random
```

## External cron-job.org setup
Create a job:

```text
URL: https://YOUR-PRODUCTION-DOMAIN/api/cron/gmail-poll
Method: GET
Schedule: every 2 minutes
```

Add HTTP header:

```text
Authorization: Bearer your-long-random-secret
```

The header value must match Vercel `CRON_SECRET` exactly.

## Deploy
Copy files into your project and replace existing files, then run:

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant
git add .
git commit -m "Add logout and external Gmail polling endpoint"
git push origin main
npx vercel --prod
```

## Test logout
After deployment, login and click `Logout` in the top navigation.

## Test cron endpoint manually
Open the external cron service test run, or use a REST client with this header:

```text
Authorization: Bearer your-long-random-secret
```

Expected JSON response includes:

```json
{
  "ok": true,
  "connections": 1,
  "found": 0,
  "processed": 0,
  "skipped": 0
}
```
