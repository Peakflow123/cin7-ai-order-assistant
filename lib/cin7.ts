import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/crypto';

async function cin7Fetch(companyId: string, path: string, options: RequestInit = {}) {
  const conn = await prisma.cin7Connection.findUnique({ where: { companyId } });
  if (!conn) throw new Error('Cin7 not connected');
  const res = await fetch(`${conn.baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'api-auth-accountid': conn.accountId,
      'api-auth-applicationkey': decrypt(conn.apiKeyEncrypted),
      ...(options.headers || {})
    }
  });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) throw new Error(`Cin7 API error ${res.status}: ${JSON.stringify(data)}`);
  return data;
}


export async function syncCin7Products(companyId: string) {
  const data = await cin7Fetch(companyId, '/product?Page=1&Limit=1000');
  const list = data.Products || data.ProductList || data.Product || data.Items || [];
  let count = 0;
  for (const p of list) {
    const name = p.Name || p.ProductName || p.name;
    const cin7Id = p.ID || p.Id || null;
    if (!name || !cin7Id) continue;
    await prisma.product.upsert({
      where: { companyId_cin7Id: { companyId, cin7Id } },
      update: {
        sku: p.SKU || p.Code || null,
        name,
        barcode: p.Barcode || p.BarCode || null,
        uom: p.UOM || p.UnitOfMeasure || null,
        status: p.Status || null
      },
      create: {
        companyId,
        cin7Id,
        sku: p.SKU || p.Code || null,
        name,
        barcode: p.Barcode || p.BarCode || null,
        uom: p.UOM || p.UnitOfMeasure || null,
        status: p.Status || null
      }
    });
    count++;
  }
  return count;
}

export async function syncCin7Customers(companyId: string) {
  const data = await cin7Fetch(companyId, '/customer?Page=1&Limit=1000');
  const list = data.Customers || data.CustomerList || data.Customer || data.Items || [];
  let count = 0;
  for (const c of list) {
    const name = c.Name || c.CustomerName || c.name;
    const cin7Id = c.ID || c.Id || null;
    if (!name || !cin7Id) continue;
    await prisma.customer.upsert({
      where: { companyId_cin7Id: { companyId, cin7Id } },
      update: { name, email: c.Email || null, phone: c.Phone || null },
      create: { companyId, cin7Id, name, email: c.Email || null, phone: c.Phone || null }
    });
    count++;
  }
  return count;
}

export async function createCin7Sale(companyId: string, orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { lines: true } });
  if (!order) throw new Error('Order not found');
  const customer = order.customerId ? await prisma.customer.findUnique({ where: { id: order.customerId } }) : null;
  const payload = {
    Customer: customer?.name || order.customerText || 'Unknown Customer',
    CustomerReference: order.poNumber || order.subject || order.id,
    Status: 'DRAFT',
    Lines: order.lines.map(l => ({ SKU: l.sku, Name: l.productName || l.rawProductText, Quantity: l.quantity, Price: 0 }))
  };
  const data = await cin7Fetch(companyId, '/sale', { method: 'POST', body: JSON.stringify(payload) });
  await prisma.order.update({ where: { id: orderId }, data: { status: 'CREATED', cin7SaleId: data.ID || data.SaleID || data.id || JSON.stringify(data).slice(0,100) } });
  return data;
}
