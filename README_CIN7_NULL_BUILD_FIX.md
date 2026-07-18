# NexOrder AI - Cin7 Refresh TypeScript Null Fix

## Error fixed

Vercel failed with:

```text
Type error: Argument of type 'string | null | undefined' is not assignable to parameter of type 'string | null'.
```

## Cause

`lastProductsSync` and `lastCustomersSync` can be `undefined`, but the refresh function expected only:

```ts
string | null
```

## Fix

The calls now use:

```ts
lastProductsSync ?? null
lastCustomersSync ?? null
```

## Deploy

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant
git add app/settings/Cin7ConnectionSection.tsx README_CIN7_NULL_BUILD_FIX.md
git commit -m "Fix Cin7 refresh TypeScript null handling"
git push origin main
npx vercel --prod
```
