# NexOrder AI - Gmail Inbox Build Fix

## Problem

Deployment failed with:

```text
Type error: Expected 2-4 arguments, but got 5.
```

The Gmail inbox route calls:

```ts
listRecentGmailMessages(connectionId, companyId, maxResults, onlyOrderRelated, options)
```

but the OCR pack accidentally replaced `lib/gmail.ts` with a version where `listRecentGmailMessages` only accepted 4 arguments.

## Fix

This pack updates only:

```text
lib/gmail.ts
```

It restores the 5th options argument:

```ts
{ fromDate, toDate, classify }
```

and keeps OCR parsing for Gmail image attachments.

## Deploy safely

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant

git add lib\gmail.ts
git add README_GMAIL_INBOX_BUILD_FIX.md

git commit -m "Fix Gmail inbox list function signature"
git push origin main
npx vercel --prod
```

Do not run `git add .`.
