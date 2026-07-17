# NexOrder AI - Auth Build Fix

## Problem
The latest build failed because older admin routes still import:

```ts
requirePlatformAdmin
```

from:

```ts
@/lib/auth
```

but the latest `lib/auth.ts` file did not export that function.

## Fix
This pack restores:

```ts
export function requirePlatformAdmin()
```

while keeping the new session timeout logic.

## Deploy
Copy the files into the project and run:

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant
git add lib/auth.ts README_AUTH_BUILD_FIX.md
git commit -m "Restore requirePlatformAdmin export"
git push origin main
npx vercel --prod
```
