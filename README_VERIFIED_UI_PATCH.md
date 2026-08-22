# NexOrder AI Verified UI Patch

This patch is intentionally limited to three current UI issues.

## Fixes

1. Replaces corrupted mobile navigation characters with inline SVG icons while preserving the existing `client-mobile-nav` structure and CSS classes.
2. Resolves the actual client company name when `ClientPortalFrame` receives no `companyName`, preventing the Orders page from showing `Order automation workspace`.
3. Replaces only the content of the public page. It does not add a header, so the existing global public header remains the only header.

## Files changed

- `components/ClientPortalFrame.tsx`
- `app/api/company/current/route.ts`
- `app/page.tsx`

## Files not changed

- `app/layout.tsx`
- global CSS
- admin portal
- authentication
- Stripe and billing
- Gmail and Outlook
- OCR
- Cin7
- database schema and migrations

## Deployment

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant

git add components\ClientPortalFrame.tsx
git add app\api\company\current\route.ts
git add app\page.tsx
git add README_VERIFIED_UI_PATCH.md

git commit -m "Fix mobile icons company header and public landing content"
git push origin main
```
