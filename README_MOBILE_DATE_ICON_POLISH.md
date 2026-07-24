# NexOrder AI - Mobile Date Field and Icon Polish Pack

## Scope

This is a small mobile UI polish pack only. It does not change functionality, backend APIs, auth, admin pages, Gmail/Outlook logic, Cin7 logic, or database logic.

## Fixes included

1. Mobile date fields no longer overflow outside cards/tiles.
2. Mobile date inputs are constrained to the available card width.
3. Mobile forms stack more safely on narrow screens.
4. NexOrder app icon is regenerated with a larger, centered `N`.

## Files changed

```text
app/client-portal.css
public/icons/icon-192.png
public/icons/icon-512.png
public/apple-touch-icon.png
README_MOBILE_DATE_ICON_POLISH.md
```

## Deploy safely

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant

git add app\client-portal.css
git add public\icons\icon-192.png
git add public\icons\icon-512.png
git add public\apple-touch-icon.png
git add README_MOBILE_DATE_ICON_POLISH.md

git commit -m "Polish mobile date fields and app icon"
git push origin main
npx vercel --prod
```

Do not run `git add .`.

## Important for iPhone icon refresh

The iPhone home screen icon is cached by iOS. If the icon does not update after deployment:

1. Delete the existing NexOrder icon from the home screen.
2. Open NexOrder AI in Safari.
3. Use Share -> Add to Home Screen again.

Then the corrected centered icon should appear.
