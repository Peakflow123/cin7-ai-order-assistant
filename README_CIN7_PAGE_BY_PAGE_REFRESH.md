# NexOrder AI - Cin7 Core Page-by-Page Manual Refresh

## Why this pack exists
The prior simple endpoint still timed out because one Vercel function was trying to process the full catalog.

## New behavior
The UI remains simple, but internally it processes one page at a time:

```text
Click Refresh
→ Product page 1
→ Product page 2
→ Customer page 1
→ Customer page 2
→ Complete
```

Each request is short, so Vercel timeout should not occur.

## Client still sees only one button

```text
Refresh Products & Customers
```

## API key and Account ID stay visible
Settings still shows:

```text
Cin7 Account ID
Cin7 API Key
```

## Automatic Cin7 cron remains disabled
The app is manual refresh only for Cin7 Core.

## Deploy

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant
git add .
git commit -m "Fix Cin7 refresh with page by page manual sync"
git push origin main
npx vercel --prod
```
