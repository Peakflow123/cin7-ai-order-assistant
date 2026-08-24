# NexOrder AI Verified UI Patch

Fixes only three issues:
1. Mobile navigation icons -> inline SVG, keeps existing `client-mobile-nav` class.
2. Orders page company name -> resolves from /api/company/current when not passed.
3. Public landing page -> one self-contained header, one logo, no admin links when logged out.

Files changed:
- components/ClientPortalFrame.tsx
- app/api/company/current/route.ts
- app/page.tsx

Not touched: app/layout.tsx, global CSS, admin portal, auth, Stripe/billing, Gmail, Outlook, OCR, Cin7, schema/migrations.

## Deploy
```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant
git add components\ClientPortalFrame.tsx
git add app\api\company\current\route.ts
git add app\page.tsx
git commit -m "Fix mobile nav icons company name and landing page"
git push origin main
```

## Clear iPhone PWA cache after deploy
Delete installed NexOrder icon -> open nexorderai.com in Safari -> clear website data for nexorderai.com -> re-add to Home Screen. Desktop: Ctrl+Shift+R.
