# NexOrder AI - Cin7 Small Batch Timeout Fix

## Reason for the continued timeout
The page-by-page endpoint still processed too many rows per request.
Cin7 GET may finish, but saving rows into Supabase can exceed Vercel's runtime.

## This fix

- Reduces `PAGE_LIMIT` from 100 to 10.
- Sets refresh-step endpoints max duration to 60 seconds.
- UI clearly shows batch size and progress.

## Deploy

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant
git add .
git commit -m "Reduce Cin7 refresh batch size to avoid timeout"
git push origin main
npx vercel --prod
```

After deployment, hard refresh the browser with Ctrl + Shift + R.
