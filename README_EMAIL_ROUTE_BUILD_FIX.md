# NexOrder AI - Email Route Build Fix

## Problem
Deployment failed because the previous upgrade added imports that do not exist in the current codebase:

```text
processEmailToOrder
getFullGmailMessage
getRecentGmailMessages
getFullOutlookMessage
getRecentOutlookMessages
```

Your existing helper is named:

```text
processEmailIntoOrder
```

and the Gmail/Outlook helper exports are different from what the previous pack assumed.

## What this fix does
This pack replaces the four new failing API routes with build-safe versions:

```text
app/api/gmail/recent/route.ts
app/api/gmail/process/route.ts
app/api/outlook/recent/route.ts
app/api/outlook/process/route.ts
```

This allows deployment to pass without touching the existing working Gmail/Outlook flow.

## Deploy

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant

git add app\api\gmail\recent\route.ts
git add app\api\gmail\process\route.ts
git add app\api\outlook\recent\route.ts
git add app\api\outlook\process\route.ts
git add README_EMAIL_ROUTE_BUILD_FIX.md

git commit -m "Fix email route build imports"
git push origin main
npx vercel --prod
```

## Next step
After deployment is stable, inspect current helper exports with:

```cmd
findstr /R "export .*function" lib\gmail.ts
findstr /R "export .*function" lib\outlook.ts
findstr /R "export .*function" lib\email-order.ts
```

Then wire the improved email filters to the exact existing helper names.
