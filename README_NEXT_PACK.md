# Next Pack - Admin, Multi-Tenant Safety, and Self-Learning

Replace the files in this ZIP into your existing project, then push to GitHub.

## New features

1. Platform admin dashboard at `/admin`.
2. Client data stays separated by `companyId` in products, customers, orders, aliases, and users.
3. Product alias learning after successful Cin7 order creation.
4. Customer alias learning after successful Cin7 order creation.
5. Better customer matching by customer alias, sender email, and name similarity.
6. Better product matching by customer-specific alias, global alias, SKU, barcode, and name similarity.

## Important Vercel environment variable

Add this in Vercel:

```text
PLATFORM_ADMIN_EMAILS=your-email@example.com
```

Use the email address you use to log in. Separate multiple admin emails with commas.

## Redeploy account concern

Redeploying Vercel should NOT delete accounts if you keep the same Supabase DATABASE_URL and DIRECT_URL. If you had to create a new account after redeploy, usually one of these happened:

1. You opened a different Vercel preview URL instead of production URL.
2. Vercel environment variables pointed to a different Supabase database.
3. Supabase database was reset/recreated.
4. Browser cookie expired, but the old account still exists and you should log in, not register again.

## Push commands

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant
git add .
git commit -m "Add admin dashboard and self learning"
git push
```
