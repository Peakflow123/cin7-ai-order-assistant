# NexOrder AI - Single Header and Review Orders Label Fix

## Scope

Client UI only. This pack does not touch API routes, auth logic, admin pages, Gmail/Outlook backend, Cin7 backend, or database logic.

## Fixes

1. Removes duplicate web header more aggressively by hiding older global header/nav only when `.client-portal` exists.
2. Header sequence changed to:

```text
Dashboard | Orders | Review Orders | Channels | Settings | Logout
```

3. Dashboard hero button changed from:

```text
Review Queue
```

to:

```text
Review Orders
```

4. Mobile bottom navigation sequence changed to:

```text
Dashboard | Orders | Review | Channels | Settings
```

## Files changed

```text
app/client-portal.css
components/ClientPortalFrame.tsx
app/dashboard/page.tsx
README_SINGLE_HEADER_REVIEW_ORDERS_FIX.md
```

## Deploy safely

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant

git add app\client-portal.css
git add components\ClientPortalFrame.tsx
git add app\dashboard\page.tsx
git add README_SINGLE_HEADER_REVIEW_ORDERS_FIX.md

git commit -m "Fix duplicate client header and review orders labels"
git push origin main
npx vercel --prod
```

Do not use `git add .`.
