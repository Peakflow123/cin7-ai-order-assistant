# Cin7 AI Order Assistant - Fixed MVP

This is a central SaaS MVP where each client can register, add their own Cin7 API credentials, sync products/customers, paste an order email, review AI-matched lines, and create a draft sale in Cin7.

## Deployment variables required in Vercel

- DATABASE_URL
- DIRECT_URL
- JWT_SECRET
- ENCRYPTION_KEY
- OPENAI_API_KEY
- OPENAI_MODEL

## Deploy flow

1. Replace the old project files with this fixed folder.
2. Push to GitHub.
3. Vercel will run:

```bash
prisma generate && prisma migrate deploy && next build
```

4. The included migration creates the database tables automatically.

## MVP test flow

1. Register account.
2. Go to Settings.
3. Save Cin7 Account ID and API Key.
4. Click Sync products/customers.
5. Go to Test Email Order.
6. Paste an email order.
7. Review extracted lines.
8. Click Create Draft Sale in Cin7.
