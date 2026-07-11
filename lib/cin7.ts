import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/crypto';

type Cin7Product = {
  ID?: string;
  Id?: string;
  SKU?: string;
  Code?: string;
  Name?: string;
  ProductName?: string;
  Barcode?: string;
  BarCode?: string;
  UOM?: string;
  UnitOfMeasure?: string;
  Status?: string;
};

type Cin7Customer = {
  ID?: string;
  Id?: string;
  Name?: string;
  CustomerName?: string;
  Email?: string;
  Phone?: string;
};

async function cin7Fetch(companyId: string, path: string, options: RequestInit = {}) {
  const connection = await prisma.cin7Connection.findUnique({ where: { companyId } });
  if (!connection) throw new Error('Cin7 not connected');

  const extraHeaders = (options.headers || {}) as Record<string, string>;

  const response = await fetch(`${connection.baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'api-auth-accountid': connection.accountId,
      'api-auth-applicationkey': decrypt(connection.apiKeyEncrypted),
      ...extraHeaders
    }
  });

  const text = await response.text();
  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(`Cin7 API error ${response.status}: ${JSON.stringify(data)}`);
  }

  return data;
}

export async function syncCin7Products(companyId: string) {
  const data = await cin7Fetch(companyId, '/product?Page=1&Limit=1000');
  const list: Cin7Product[] = data.Products || data.ProductList || data.Product || data.Items || [];
  let count = 0;

  for (const item of list) {
    const name = item.Name || item.ProductName;
    const cin7Id = item.ID || item.Id;
    if (!name || !cin7Id) continue;

    await prisma.product.upsert({
      where: { companyId_cin7Id: { companyId, cin7Id } },
      update: {
        sku: item.SKU || item.Code || null,
        name,
        barcode: item.Barcode || item.BarCode || null,
        uom: item.UOM || item.UnitOfMeasure || null,
        status: item.Status || null
      },
      create: {
        companyId,
        cin7Id,
        sku: item.SKU || item.Code || null,
        name,
        barcode: item.Barcode || item.BarCode || null,
        uom: item.UOM || item.UnitOfMeasure || null,
        status: item.Status || null
      }
    });

    count += 1;
  }

  return count;
}

export async function syncCin7Customers(companyId: string) {
  const data = await cin7Fetch(companyId, '/customer?Page=1&Limit=1000');
  const list: Cin7Customer[] = data.Customers || data.CustomerList || data.Customer || data.Items || [];
  let count = 0;

  for (const item of list) {
    const name = item.Name || item.CustomerName;
    const cin7Id = item.ID || item.Id;
    if (!name || !cin7Id) continue;

    await prisma.customer.upsert({
      where: { companyId_cin7Id: { companyId, cin7Id } },
      update: {
        name,
        email: item.Email || null,
        phone: item.Phone || null
      },
      create: {
        companyId,
        cin7Id,
        name,
        email: item.Email || null,
        phone: item.Phone || null
      }
    });

    count += 1;
  }

  return count;
}

export async function createCin7Sale(companyId: string, orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { lines: true }
  });

  if (!order) throw new Error('Order not found');

  const customer = order.customerId
    ? await prisma.customer.findUnique({ where: { id: order.customerId } })
    : null;

  const saleOrderLines = [];

  for (const line of order.lines) {
    if (!line.productId) continue;

    const product = await prisma.product.findUnique({ where: { id: line.productId } });
    if (!product) continue;

    const quantity = Number(line.quantity || 1);
    const price = 0;
    const discount = 0;
    const tax = 0;
    const total = 0;

    saleOrderLines.push({
      ProductID: product.cin7Id,
      SKU: product.sku || line.sku || '',
      Name: product.name || line.productName || line.rawProductText,
      Quantity: quantity,
      Price: price,
      Discount: discount,
      Tax: tax,
      Total: total,
      TaxRule: 'Tax Exempt (Sale)',
      Comment: line.rawProductText
    });
  }

  if (saleOrderLines.length === 0) {
    throw new Error('No matched product lines found. Please make sure order lines are matched before creating Cin7 sale.');
  }

  /*
    IMPORTANT:
    Cin7 ignored top-level "Lines" in your API log.
    Order lines must be sent inside the nested "Order" object as "Order.Lines".
    This payload also creates the sale order as AUTHORISED.
  */
  const payload = {
    CustomerID: customer?.cin7Id || undefined,
    Customer: customer?.name || order.customerText || 'Unknown Customer',
    CustomerReference: order.poNumber || order.subject || order.id,
    OrderStatus: 'AUTHORISED',
    InvoiceStatus: 'NOTAUTHORISED',
    AutoPickPackShipMode: 'NOPICK',
    CurrencyRate: 1,
    Note: `Created by AI Order Assistant from ${order.source}`,
    Order: {
      Memo: order.poNumber ? `Customer PO: ${order.poNumber}` : null,
      Status: 'AUTHORISED',
      Lines: saleOrderLines,
      AdditionalCharges: []
    }
  };

  console.log('Cin7 sale payload:', JSON.stringify(payload));

  const data = await cin7Fetch(companyId, '/sale', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  const createdLines = data?.Order?.Lines || [];

  if (!Array.isArray(createdLines) || createdLines.length === 0) {
    throw new Error(
      `Cin7 created sale header but returned zero order lines. Payload used: ${JSON.stringify(payload)} Response: ${JSON.stringify(data)}`
    );
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'CREATED',
      cin7SaleId: data.ID || data.SaleID || data.id || JSON.stringify(data).slice(0, 100)
    }
  });

  return data;
}
