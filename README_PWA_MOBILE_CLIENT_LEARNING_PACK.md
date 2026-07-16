# NexOrder AI - PWA Mobile Review + Client-Based Learning Pack

This pack adds the second mobile option: a Progressive Web App (PWA).

## What is included

1. PWA support:
   - `public/manifest.webmanifest`
   - `public/sw.js`
   - app icons: 192px and 512px
   - offline fallback page
   - service worker registration
   - install helper button

2. Mobile review page:
   - `/mobile`
   - Needs Review tab
   - Created tab
   - Channel/account filters
   - Order cards optimized for phone screens
   - Open order review page from mobile

3. Dashboard/mobile navigation:
   - `Mobile Review` link in desktop navigation
   - mobile header `Review` button
   - dashboard card for Mobile Review App

4. Client-based AI learning confirmed and strengthened:
   - Classifier uses `companyId`
   - `OrderFeedback` learning remains client-specific
   - Gmail classification passes `companyId`
   - Email processing passes `companyId`

## Important

The PWA is not a separate App Store app. Clients install it from browser:

- Android Chrome: install prompt or Add to Home Screen
- iPhone Safari: Share > Add to Home Screen

## Deploy

Copy files into your existing project and replace files.

Then run:

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant
git add .
git commit -m "Add PWA mobile review and enforce client based learning"
git push origin main
npx vercel --prod
```

## Test

1. Open `/mobile` on desktop and phone.
2. Confirm Needs Review and Created lists show.
3. Open an order from mobile and approve/create it.
4. On mobile browser, use Add to Home Screen.
5. Delete a false order with feedback, then confirm future classifier uses only that client/company feedback.
