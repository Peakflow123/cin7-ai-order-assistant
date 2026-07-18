# NexOrder AI - Cin7 Timeout Cache Guard Pack

## Why this exists
The browser is still hitting the old long-running endpoint:

```text
/api/settings/cin7/refresh
```

That old endpoint causes:

```text
FUNCTION_INVOCATION_TIMEOUT
```

The new page-by-page refresh should call:

```text
/api/settings/cin7/refresh-step
/api/settings/cin7/refresh-complete
```

## What this pack does

1. Disables the old timeout endpoint so it cannot hang anymore.
2. Disables the old admin timeout endpoint.
3. Updates the service worker to stop serving stale cached JavaScript.
4. Keeps the page-by-page refresh system active.

## Deploy

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant
git add .
git commit -m "Disable old Cin7 refresh endpoint and clear PWA cache"
git push origin main
npx vercel --prod
```

## After deployment

1. Open Chrome DevTools.
2. Application -> Service Workers.
3. Click Unregister for this app.
4. Press Ctrl + Shift + R.
5. Test Refresh Products & Customers again.

If the old endpoint is still called, you will see a clear message instead of timeout.
