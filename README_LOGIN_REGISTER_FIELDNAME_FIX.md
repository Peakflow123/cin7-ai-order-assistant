# NexOrder AI - Login/Register Field Name Fix

## Problem
After the latest upgrade, login and register pages showed:

```text
Email and password are required.
```

even when email/password were typed.

## Cause
The auth API expects form fields named:

```text
email
password
```

but the deployed UI form fields were not reliably submitting those exact names.

## Fix
This pack replaces:

```text
app/login/page.tsx
app/register/page.tsx
app/api/auth/login/route.ts
app/api/auth/register/route.ts
```

with clean form submissions using correct `name` attributes and safer body parsing for both form and JSON requests.

## Deploy

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant
git add .
git commit -m "Fix login and register form field submission"
git push origin main
npx vercel --prod
```
