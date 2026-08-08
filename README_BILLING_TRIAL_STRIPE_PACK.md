# NexOrder AI Billing, Trial, Stripe and Landing Page Pack

This pack adds the commercial wrapper for NexOrder AI:

- 15-day free trial without card required.
- Plan and monthly order-limit fields on companies.
- Billing page for clients.
- Stripe Checkout subscription flow.
- Stripe webhook to activate, cancel, or mark subscriptions past due.
- Stripe Customer Portal route.
- Admin billing/trial control page.
- Landing page polish with consistent NexOrder AI branding.
- Usage enforcement on Gmail and Outlook email processing.

## Required Vercel variables

Add these in Vercel before testing Stripe:

```text
APP_BASE_URL=https://www.nexorderai.com
STRIPE_SECRET_KEY=sk_live_or_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PROFESSIONAL=price_...
STRIPE_PRICE_BUSINESS=price_...
```

Use Stripe test mode first.

## Stripe product setup

Create 3 monthly recurring prices in Stripe:

```text
Starter       $49/month
Professional $149/month
Business     $299/month
```

Copy each Stripe Price ID into the matching Vercel variable.

## Stripe webhook endpoint

Create a webhook endpoint in Stripe:

```text
https://www.nexorderai.com/api/stripe/webhook
```

Subscribe to these events:

```text
checkout.session.completed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
```

## Deploy commands

Do not run `git add .`.

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant

git add prisma\migrations\20260808220000_billing_trial_subscription\migration.sql
git add lib\billing.ts
git add app\billing\page.tsx
git add app\api\billing\create-checkout\route.ts
git add app\api\billing\portal\route.ts
git add app\api\stripe\webhook\route.ts
git add app\api\gmail\process\route.ts
git add app\api\outlook\process\route.ts
git add app\admin\billing\page.tsx
git add app\api\admin\billing\update\route.ts
git add app\page.tsx
git add README_BILLING_TRIAL_STRIPE_PACK.md

git commit -m "Add billing trial Stripe and landing page"
git push origin main
npx vercel --prod
```

## How order limits work

The app counts orders created in the current calendar month for the client's company. If the client reaches the monthly limit, Gmail/Outlook processing returns an error and asks the client to upgrade.

Trial users get 100 orders during the trial period. Starter gets 300, Professional gets 1500, Business gets 5000.

## Notes

This pack does not require card details before trial. Stripe payment happens after the user chooses a plan from `/billing`.
