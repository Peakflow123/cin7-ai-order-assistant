# Cin7 AI Order Assistant MVP

This is a central SaaS MVP owned by you. Each client creates an account, adds their Cin7 API details, syncs products/customers, and processes customer email orders into reviewed Cin7 draft sales orders.

## What is included
- Multi-company signup/login
- Cin7 API credential storage with encryption
- Product/customer sync from Cin7
- AI order extraction from pasted email text
- Product matching against synced Cin7 products
- Order review screen
- Create draft sale in Cin7
- Outlook and Gmail OAuth starter routes

## Important
Start with manual pasted email testing first. Once Cin7 order creation works, enable Outlook/Gmail polling/webhooks.

## Local setup
1. Copy `.env.example` to `.env`
2. Add `DATABASE_URL`, `JWT_SECRET`, `ENCRYPTION_KEY`, `OPENAI_API_KEY`
3. Run:

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

Open http://localhost:3000

## Deployment summary
- Database: Supabase free Postgres
- App: Vercel free hosting
- AI: OpenAI API key
- Email OAuth: Microsoft Azure App Registration and/or Google Cloud OAuth

## MVP flow
1. Register company
2. Save Cin7 Account ID and API Key
3. Sync products/customers
4. Paste customer order email in Test Email Order
5. Review AI matched lines
6. Click Create Draft Sale in Cin7
