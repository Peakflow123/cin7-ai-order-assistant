# NexOrder AI - User Cleanup, Session Timeout and Order Filter Pack

This upgrade adds the controls requested after testing.

## 1. Delete test user accounts

New admin page:

```text
/admin/users
```

From there, the admin can delete test login accounts one by one. The current logged-in admin account cannot delete itself.

## 2. Duplicate email protection

`User.email` is globally unique in the schema. This means the same email cannot register twice.

This pack also updates the register route to:

- normalize email to lowercase
- check existing user before creating account
- show a clear duplicate email message

## 3. Auto logout setting

New setting on client settings page:

```text
Settings → Security Session
```

Options:

- 1 hour
- 6 hours
- 12 hours
- Never auto logout

This is stored per user as:

```text
sessionTimeoutMinutes
```

## 4. Order filter cleanup

Orders page channel filter now only shows:

```text
Gmail
Outlook
```

Removed from active filter UI:

```text
WhatsApp
manual-email
```

Channel labels now show proper capitalization.

## Deploy

Copy files into your project and replace files, then run:

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant
git add .
git commit -m "Add user cleanup session timeout and order filter cleanup"
git push origin main
npx vercel --prod
```

## Test

1. Login as admin.
2. Open `/admin/users`.
3. Delete test users one by one.
4. Try registering using an already used email.
5. Open client Settings and change session timeout.
6. Open Orders and confirm channel filter only shows Gmail and Outlook.
