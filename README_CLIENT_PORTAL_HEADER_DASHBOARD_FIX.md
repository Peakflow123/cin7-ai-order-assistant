# NexOrder AI - Client Header and Dashboard Fix Pack

## Scope

Client UI only. No API, auth, admin, Gmail/Outlook backend, Cin7, or database logic is changed.

## Fixes included

1. Removes duplicate client headers by hiding the older global client header when the client portal frame is active.
2. Keeps a single header with:

```text
NexOrder AI
Client company name
Dashboard | Orders | Channels | Settings | Logout
```

3. Keeps mobile bottom tabs.
4. Removes `Client workspace` label from dashboard hero.
5. Removes `Load Emails` button from dashboard hero.
6. Keeps only `Review Queue` button in the dashboard hero.
7. Adds date filters above dashboard KPIs.
8. Dashboard KPIs now respond to date range.
9. Renames:

```text
Gmail Inbox Automation Test -> Gmail Order Inbox
Outlook Inbox Test -> Outlook Order Inbox
```

## Files changed

```text
app/client-portal.css
components/ClientPortalFrame.tsx
app/dashboard/page.tsx
app/email/page.tsx
app/email/GmailInboxClient.tsx
app/email/OutlookInboxClient.tsx
README_CLIENT_PORTAL_HEADER_DASHBOARD_FIX.md
```

## Deploy safely

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant

git add app\client-portal.css
git add components\ClientPortalFrame.tsx
git add app\dashboard\page.tsx
git add app\email\page.tsx
git add app\email\GmailInboxClient.tsx
git add app\email\OutlookInboxClient.tsx
git add README_CLIENT_PORTAL_HEADER_DASHBOARD_FIX.md

git commit -m "Fix client header dashboard filters and email inbox labels"
git push origin main
npx vercel --prod
```

Do not run `git add .`.
