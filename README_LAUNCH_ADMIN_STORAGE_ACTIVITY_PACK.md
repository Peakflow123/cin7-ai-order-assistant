# NexOrder AI - Launch Admin Storage, Lifecycle, Date Filters, Activity and Logs Pack

This pack adds the launch/admin features requested.

## Included upgrades

### 1. Client storage usage
Admin dashboard now shows estimated storage per client:

- Products
- Customers
- Orders
- Order lines
- Feedback
- Activity logs
- System logs
- Estimated storage used

Page area:

```text
/admin → Storage
```

### 2. Three-level company lifecycle
Admin can now:

1. Deactivate client
2. Archive client
3. Delete client permanently

Permanent delete requires typing:

```text
DELETE
```

Permanent deletion removes:

- Users
- Products
- Customers
- Orders
- Order lines
- Aliases
- Feedback
- Gmail connections
- Outlook connections
- Cin7 connection
- Activity logs
- System logs

### 3. Date filters on orders
Added From/To date filters to:

```text
/orders
/mobile
```

### 4. Activity monitoring
New page:

```text
/admin/activity
```

Tracks important admin actions such as:

- Client controls updated
- Client deactivated
- Client reactivated
- Client archived
- Client unarchived
- Client deletion started

### 5. Admin logs
New page:

```text
/admin/logs
```

This uses stored system logs. It is intentionally lightweight to avoid unnecessary storage growth.

### 6. Existing session timeout
This assumes the previous session timeout pack is already applied. If not, apply that pack first.

## Deploy

Copy files into the project and replace files.

Then run:

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant
git add .
git commit -m "Add launch admin storage lifecycle activity and date filters"
git push origin main
npx vercel --prod
```

## Test checklist

1. Login as admin.
2. Open `/admin`.
3. Check storage table.
4. Deactivate a test client.
5. Archive a test client.
6. Test permanent delete with a test client only.
7. Open `/admin/activity` and confirm actions are logged.
8. Open `/orders` and test date filters.
9. Open `/mobile` and test date filters.
