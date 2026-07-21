# NexOrder AI - Client Portal Polish Pack

## Scope

This pack is **client-side UI only**. It does not change API routes, extraction logic, Gmail/Outlook logic, Cin7 logic, database sync logic, admin auth, or admin portal behavior.

## What it improves

- Professional SaaS-style client navigation
- Better desktop top navigation
- Better mobile bottom navigation
- Cleaner client dashboard
- More purposeful colors
- Less unnecessary text
- Better cards, buttons, badges and forms
- New NexOrder AI logo asset

## Files changed

```text
app/client-portal.css
components/ClientPortalFrame.tsx
app/dashboard/page.tsx
app/email/page.tsx
app/orders/page.tsx
public/nexorder-logo.svg
README_CLIENT_PORTAL_POLISH_PACK.md
```

## Deploy safely

Do not run `git add .`.

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant

git add app\client-portal.css
git add components\ClientPortalFrame.tsx
git add app\dashboard\page.tsx
git add app\email\page.tsx
git add app\orders\page.tsx
git add public\nexorder-logo.svg
git add README_CLIENT_PORTAL_POLISH_PACK.md

git commit -m "Polish client portal navigation and dashboard UI"
git push origin main
npx vercel --prod
```

## Test checklist

After deployment:

1. Login as client.
2. Open `/dashboard`.
3. Open `/email`.
4. Load Gmail/Outlook emails.
5. Process one email.
6. Open `/orders` and test filters.
7. Test on mobile size or phone browser.

## Important

This pack intentionally avoids changing:

```text
lib/auth.ts
app/admin/*
app/api/*
lib/cin7.ts
lib/gmail.ts
lib/outlook.ts
```
