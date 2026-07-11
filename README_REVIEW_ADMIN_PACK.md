# Review + Admin Control Upgrade Pack

This pack adds:

1. Client cannot replace Cin7 credentials after first connection unless admin allows it.
2. Client can manually refresh products/customers.
3. Admin can manage each client from `/admin` and `/admin/clients/[id]`.
4. Admin can update Cin7 credentials for clients.
5. Admin can enable/disable auto-create and set confidence threshold.
6. Review screen now shows mapped Cin7 customer and allows editing customer/product/quantity/UOM before sending to Cin7.
7. If auto-create is enabled and confidence is above threshold, the system creates the Cin7 sale automatically.

## Copy files
Copy all folders/files into existing project and replace files.

## Push
```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant
git add .
git commit -m "Add review editing and admin client controls"
git push
```
