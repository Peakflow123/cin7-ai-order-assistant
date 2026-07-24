# NexOrder AI - Mobile Header, Bottom Navigation and App Icon Fix

## Scope

This pack fixes mobile/web-app UI consistency only. It does not change Gmail, Outlook, Cin7, AI extraction, admin, database sync, or API behavior.

## Fixes included

1. PWA/mobile app icon is replaced with a proper NexOrder AI gradient icon with `N`.
2. Mobile header is visible on Dashboard, Orders, Channels, Review and Settings.
3. Mobile bottom navigation is visible on Dashboard, Orders, Channels, Review and Settings.
4. Desktop layout remains unchanged.
5. Header and bottom navigation are centralized through `ClientPortalFrame`.

## Files changed

```text
app/client-portal.css
components/ClientPortalFrame.tsx
app/settings/layout.tsx
app/mobile/layout.tsx
public/manifest.webmanifest
public/icons/icon-192.png
public/icons/icon-512.png
public/apple-touch-icon.png
README_MOBILE_NAVIGATION_ICON_FIX.md
```

## Deploy safely

Do not use `git add .`.

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant

git add app\client-portal.css
git add components\ClientPortalFrame.tsx
git add app\settings\layout.tsx
git add app\mobile\layout.tsx
git add public\manifest.webmanifest
git add public\icons\icon-192.png
git add public\icons\icon-512.png
git add public\apple-touch-icon.png
git add README_MOBILE_NAVIGATION_ICON_FIX.md

git commit -m "Fix mobile client navigation and app icon"
git push origin main
npx vercel --prod
```

## After deployment

On iPhone, the installed PWA icon may remain cached. If the icon does not update immediately:

1. Delete the current NexOrder app icon from the home screen.
2. Open the app in Safari.
3. Use Share -> Add to Home Screen again.

Then test:

```text
/dashboard
/orders
/mobile
/email
/settings
```

All should show the mobile header and bottom navigation.
