# NexOrder AI - Email Range, Duplicate Prevention, Review Feedback, Product Search Pack

## Included improvements

### 1. Gmail/Outlook loading improvements
New API routes support:

```text
limit = 25 / 50 / 100
fromDate
toDate
includeNotOrders
```

Default recommendation: load last 50 emails.

### 2. Duplicate prevention for replies/forwards
New helper:

```text
lib/message-dedupe.ts
```

It creates dedupe keys using:

```text
message id
thread id
conversation id
internet message id
normalized subject + sender
```

This helps avoid creating another order from a reply or forwarded message in the same conversation.

### 3. Review approval feedback
Users can submit optional feedback before approving/creating the Cin7 order.

Route:

```text
/api/orders/[id]/review-feedback
```

The create-Cin7 route also accepts:

```json
{ "reviewFeedback": "optional feedback" }
```

### 4. Working product search API
New route:

```text
/api/products/search?q=search-text
```

It searches:

```text
SKU
product name
barcode
```

### 5. Working customer search API
New route:

```text
/api/customers/search?q=search-text
```

## Important integration note
If your existing UI files have different names, use these components/routes to wire into the current UI:

```text
components/EmailLoadFilters.tsx
components/ProductSearchBox.tsx
```

## Deploy

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant
git add .
git commit -m "Add email range duplicate prevention review feedback and search"
git push origin main
npx vercel --prod
```
