# NexOrder AI - Simple Visible Manual Cin7 Core Pack

This pack intentionally removes the complex queue/background/automatic sync approach.

## Final behavior

### Client Settings
On `/settings`, client can see and edit:

```text
Cin7 Account ID
Cin7 API Key
```

Both values remain visible after saving.

### Save connection
Client clicks:

```text
Save / Update Cin7 Connection
```

### Manual refresh only
Client clicks:

```text
Refresh Products & Customers
```

Admin can also refresh from:

```text
/admin/clients
```

### No automatic refresh
The `/api/cron/cin7-sync` endpoint now returns:

```text
Automatic Cin7 Core sync is disabled. Manual refresh only.
```

### Duplicate protection
Products/customers still use:

```text
companyId + cin7Id
```

so existing records are updated instead of duplicated.

## Fix included

The frontend no longer uses the broken pattern that caused:

```text
Failed to execute 'text' on 'Response': body stream already read
```

It reads the response body only once.

## Deploy

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant
git add .
git commit -m "Simplify Cin7 Core connection and manual refresh"
git push origin main
npx vercel --prod
```

## Test

1. Open `/settings`.
2. Confirm Account ID and API Key are visible.
3. Click Update Cin7 Connection.
4. Click Refresh Products & Customers.
5. Confirm success message appears.
6. Confirm product/customer counts update.
