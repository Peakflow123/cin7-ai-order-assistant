# Stripe Checkout Premature Upgrade Fix

This fixes the issue where clicking a plan button updates the company plan before payment is completed.

## Correct behavior

- Clicking Starter/Professional/Business only opens Stripe Checkout.
- The app does not change the company plan at this stage.
- The company is upgraded only when Stripe sends a successful webhook event:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`

## File changed

```text
app/api/billing/create-checkout/route.ts
```

## Deploy

Do not run `git add .`.

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant

git add app\api\billing\create-checkout\route.ts
git add README_STRIPE_CHECKOUT_PREMATURE_UPGRADE_FIX.md

git commit -m "Fix Stripe checkout premature plan upgrade"
git push origin main
```

Let Vercel deploy from GitHub.

## Test

1. Login as client.
2. Open `/billing`.
3. Click Professional.
4. Close/cancel Stripe checkout without paying.
5. Return to `/billing`.
6. The plan should NOT change to Professional.
7. Complete payment with Stripe test card.
8. After webhook succeeds, the plan should update.
