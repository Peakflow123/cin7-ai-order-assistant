# NexOrder AI Final Commercial Wrap-Up Pack

This pack is designed to finish the commercial/customer-facing flow in one controlled step.

## What this pack does

- Replaces the rough public landing page with a clean, single-header marketing homepage.
- Adds 15-day free trial logic with no credit card required.
- Adds plan/subscription fields to Company.
- Adds `/billing` for clients.
- Adds Stripe Checkout subscription flow.
- Adds Stripe webhook processing.
- Adds Stripe customer billing portal route.
- Adds `/admin/billing` for manual admin control.
- Enforces billing/trial/order limits when processing Gmail, Outlook or creating Cin7 orders.

## Trial and plan rules

- Trial: 15 days, 100 processed orders.
- Starter: $49/month, 300 orders/month.
- Professional: $149/month, 1,500 orders/month.
- Business: $299/month, 5,000 orders/month.

If the trial expires, subscription is cancelled/past_due, or the monthly order limit is reached, the app blocks new order processing and tells the user to open Billing.

## Vercel environment variables required

Add these before testing Stripe:

```text
APP_BASE_URL=https://www.nexorderai.com
STRIPE_SECRET_KEY=sk_test_or_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRICE_STARTER=price_xxxxx
STRIPE_PRICE_PROFESSIONAL=price_xxxxx
STRIPE_PRICE_BUSINESS=price_xxxxx
```

Use Stripe test mode first.

## Stripe setup

Create 3 monthly recurring prices:

- Starter: $49/month
- Professional: $149/month
- Business: $299/month

Copy the Stripe Price IDs into Vercel.

Create a Stripe webhook endpoint:

```text
https://www.nexorderai.com/api/stripe/webhook
```

Subscribe to events:

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

git add prisma\migrations\20260809001000_commercial_billing_trial\migration.sql
git add lib\billing.ts
git add app\page.tsx
git add app\billing\page.tsx
git add app\api\billing\create-checkout\route.ts
git add app\api\billing\portal\route.ts
git add app\api\stripe\webhook\route.ts
git add app\api\gmail\process\route.ts
git add app\api\outlook\process\route.ts
git add "app\api\orders\[id]\create-cin7\route.ts"
git add app\admin\billing\page.tsx
git add app\api\admin\billing\update\route.ts
git add README_FINAL_COMMERCIAL_BILLING_PACK.md

git commit -m "Add commercial trial billing and landing page"
git push origin main
```

If Vercel auto-deploys from GitHub, use that and skip the CLI. If CLI still complains about root directory, deploy from the Vercel Deployments page.

## Test order

1. Open landing page.
2. Create a new account.
3. Login and open `/billing`.
4. Confirm trial shows as active.
5. Process an order.
6. In admin, open `/admin/billing` and set the client to `trial_expired`.
7. Try processing an order again and confirm it is blocked.
8. Configure Stripe test prices and test Checkout.
