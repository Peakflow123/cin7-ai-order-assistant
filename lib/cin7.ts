import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import { learnFromSuccessfulOrder } from '@/lib/ai';

type AnyObject = Record<string, any>;

async function cin7Fetch(companyId: string, path: string, options: RequestInit = {}) {
  const connection = await prisma.cin7Connection.findUnique({ where: { companyId } });
  if (!connection) throw new Error('Cin7 not connected');

  const response = await fetch(`${connection.baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'api-auth-accountid': connection.accountId,
      'api-auth-applicationkey': decrypt(connection.apiKeyEncrypted),
      ...((options.headers || {}) as Record<string, string>)
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

function firstRecord(data: any, keys: string[]) {
  for (const key of keys) {
    if (Array.isArray(data?.[key]) && data[key][0]) return data[key][0];
    if (data?.[key] && typeof data[key] === 'object') return data[key];
  }
  return data;
}

function n(value: any, fallback = NaN) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
  return fallback;
}

function norm(value: any) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function addressFrom(raw: any) {
  if (!raw || typeof raw !== 'object') return null;

  const address = {
    Line1: String(raw.Line1 || raw.AddressLine1 || raw.DisplayAddressLine1 || raw.Address1 || raw.Street || '').trim(),
    Line2: String(raw.Line2 || raw.AddressLine2 || raw.DisplayAddressLine2 || raw.Address2 || '').trim(),
    City: String(raw.City || raw.Suburb || raw.Town || '').trim(),
    State: String(raw.State || raw.Region || raw.Province || '').trim(),
    Postcode: String(raw.Postcode || raw.PostCode || raw.PostalCode || raw.Zip || raw.ZipCode || '').trim(),
    Country: String(raw.Country || raw.CountryCode || '').trim()
  };

  const hasAddress = Object.values(address).some((value) => String(value || '').trim() !== '');
  return hasAddress ? address : null;
}

function findAddress(customer: any, type: 'billing' | 'shipping') {
  if (!customer) return null;

  const direct = type === 'billing'
    ? [customer.BillingAddress, customer.BillTo, customer.Billing, customer.DefaultBillingAddress]
    : [customer.ShippingAddress, customer.ShipTo, customer.Shipping, customer.DefaultShippingAddress];

  for (const item of direct) {
    const mapped = addressFrom(item);
    if (mapped) return mapped;
  }

  const arrays = [customer.Addresses, customer.AddressList, customer.CustomerAddresses, customer.ShippingAddresses, customer.BillingAddresses];

  for (const arr of arrays) {
    if (!Array.isArray(arr)) continue;

    const preferred = arr.find((item: any) => {
      const label = norm(item.Type || item.AddressType || item.Name || item.Description || item.Label);
      const isDefault = Boolean(item.Default || item.IsDefault || item.IsPrimary || item.DefaultForType);
      return type === 'billing'
        ? label.includes('bill') || isDefault
        : label.includes('ship') || isDefault;
    });

    const mappedPreferred = addressFrom(preferred);
    if (mappedPreferred) return mappedPreferred;

    const mappedFirst = addressFrom(arr[0]);
    if (mappedFirst) return mappedFirst;
  }

  return null;
}

async function getCustomerDetails(companyId: string, customerId?: string | null) {
  if (!customerId) return null;
  try {
    const data = await cin7Fetch(companyId, `/customer?ID=${encodeURIComponent(customerId)}`);
    return firstRecord(data, ['Customers', 'CustomerList', 'Customer']);
  } catch {
    return null;
  }
}

function walkValues(source: any, prefix = '', depth = 0): Array<{ path: string; value: any }> {
  if (!source || typeof source !== 'object' || depth > 4) return [];

  const output: Array<{ path: string; value: any }> = [];
  for (const key of Object.keys(source)) {
    const value = source[key];
    const path = prefix ? `${prefix}.${key}` : key;
    output.push({ path, value });
    if (value && typeof value === 'object') output.push(...walkValues(value, path, depth + 1));
  }
  return output;
}

function priceFromProduct(productData: any, priceTier: string | null) {
  const product = firstRecord(productData, ['Products', 'ProductList', 'Product']);
  const tier = norm(priceTier);

  const arrays = [product?.PriceTiers, product?.PriceTier, product?.Prices, product?.SalePrices, product?.SellingPrices, product?.SellingPriceTiers, product?.ProductPrices];

  for (const arr of arrays) {
    if (!Array.isArray(arr)) continue;
    const match = arr.find((item: AnyObject) => [item.Name, item.PriceTier, item.Tier, item.TierName, item.Description, item.Key, item.Label].some((v) => norm(v) === tier));
    if (match) {
      const price = n(match.Price ?? match.Value ?? match.Amount ?? match.UnitPrice ?? match.SalePrice);
      if (Number.isFinite(price)) return price;
    }
  }

  const paths = walkValues(product);
  for (const entry of paths) {
    const price = n(entry.value);
    const path = norm(entry.path);
    if (Number.isFinite(price) && tier && (path === tier || path.endsWith(tier) || path.includes(`${tier}price`))) return price;
  }

  for (let i = 1; i <= 10; i += 1) {
    for (const key of [`PriceTier${i}`, `PriceTier${i}Price`, `Tier${i}`, `Tier${i}Price`, `Price${i}`]) {
      const price = n(product?.[key]);
      if (Number.isFinite(price) && price > 0) return price;
    }
  }

  const direct = n(product?.Price ?? product?.SalePrice ?? product?.SellPrice ?? product?.RetailPrice ?? product?.DefaultPrice ?? product?.UnitPrice);
  if (Number.isFinite(direct)) return direct;

  throw new Error(`Could not find product price for price tier '${priceTier}'. Product keys: ${JSON.stringify(Object.keys(product || {}).slice(0, 80))}`);
}

async function getProductPrice(companyId: string, productId: string | null, priceTier: string | null) {
  if (!productId) throw new Error('Product Cin7 ID is missing.');
  const productData = await cin7Fetch(companyId, `/product?ID=${encodeURIComponent(productId)}`);
  return priceFromProduct(productData, priceTier);
}

export async function syncCin7Products(companyId: string) {
  const data = await cin7Fetch(companyId, '/product?Page=1&Limit=1000');
  const list = data.Products || data.ProductList || data.Product || data.Items || [];
  let count = 0;

  for (const item of list) {
    const name = item.Name || item.ProductName || item.name;
    const cin7Id = item.ID || item.Id || item.id;
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
  const list = data.Customers || data.CustomerList || data.Customer || data.Items || [];
  let count = 0;

  for (const item of list) {
    const name = item.Name || item.CustomerName || item.name;
    const cin7Id = item.ID || item.Id || item.id;
    if (!name || !cin7Id) continue;

    await prisma.customer.upsert({
      where: { companyId_cin7Id: { companyId, cin7Id } },
      update: { name, email: item.Email || null, phone: item.Phone || null },
      create: { companyId, cin7Id, name, email: item.Email || null, phone: item.Phone || null }
    });

    count += 1;
  }

  return count;
}

export async function createCin7Sale(companyId: string, orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { lines: true } });
  if (!order) throw new Error('Order not found');

  const customer = order.customerId ? await prisma.customer.findUnique({ where: { id: order.customerId } }) : null;
  const customerDetails = await getCustomerDetails(companyId, customer?.cin7Id);
  const billingAddress = findAddress(customerDetails, 'billing');
  const shippingAddress = findAddress(customerDetails, 'shipping');

  const matchedProducts = [];
  for (const line of order.lines) {
    if (!line.productId) continue;
    const product = await prisma.product.findUnique({ where: { id: line.productId } });
    if (product) matchedProducts.push({ line, product });
  }

  if (matchedProducts.length === 0) throw new Error('No matched product lines found.');

  const saleHeaderPayload: AnyObject = {
    CustomerID: customer?.cin7Id || undefined,
    Customer: customer?.name || order.customerText || 'Unknown Customer',
    Contact: customerDetails?.Contact || customerDetails?.DefaultContact || undefined,
    Phone: customerDetails?.Phone || customer?.phone || undefined,
    Email: customerDetails?.Email || customer?.email || undefined,
    CustomerReference: order.poNumber || order.subject || order.id,
    OrderStatus: 'NOTAUTHORISED',
    InvoiceStatus: 'NOTAUTHORISED',
    AutoPickPackShipMode: 'NOPICK',
    CurrencyRate: 1,
    Note: `Created by AI Order Assistant from ${order.source}`
  };

  if (billingAddress) saleHeaderPayload.BillingAddress = billingAddress;
  if (shippingAddress) saleHeaderPayload.ShippingAddress = shippingAddress;

  const sale = await cin7Fetch(companyId, '/sale', { method: 'POST', body: JSON.stringify(saleHeaderPayload) });
  const saleId = sale.ID || sale.SaleID || sale.id;
  if (!saleId) throw new Error(`Cin7 did not return SaleID. Response: ${JSON.stringify(sale)}`);

  const priceTier = sale.PriceTier || null;
  const taxRule = sale.TaxRule || 'Tax Exempt (Sale)';
  if (!priceTier) throw new Error(`Cin7 sale response did not return PriceTier. Response: ${JSON.stringify(sale)}`);

  const lines = [];
  for (const item of matchedProducts) {
    const quantity = Number(item.line.quantity || 1);
    const price = await getProductPrice(companyId, item.product.cin7Id, priceTier);
    const discount = 0;
    const tax = 0;
    const total = Number((quantity * price - discount + tax).toFixed(4));

    lines.push({
      ProductID: item.product.cin7Id,
      SKU: item.product.sku || item.line.sku || '',
      Name: item.product.name || item.line.productName || item.line.rawProductText,
      Quantity: quantity,
      Price: price,
      Discount: discount,
      Tax: tax,
      AverageCost: null,
      TaxRule: taxRule,
      Comment: item.line.rawProductText,
      DropShip: false,
      BackorderQuantity: null,
      Total: total
    });
  }

  const totalBeforeTax = Number(lines.reduce((sum, line) => sum + line.Quantity * line.Price - line.Discount, 0).toFixed(4));
  const tax = Number(lines.reduce((sum, line) => sum + line.Tax, 0).toFixed(4));
  const total = Number((totalBeforeTax + tax).toFixed(4));

  const saleOrderPayload = {
    SaleID: saleId,
    SaleOrderNumber: null,
    Memo: order.poNumber ? `Customer PO: ${order.poNumber}` : '',
    Status: 'AUTHORISED',
    CombineAdditionalCharges: false,
    TotalBeforeTax: totalBeforeTax,
    Tax: tax,
    Total: total,
    Lines: lines,
    AdditionalCharges: [],
    AutoPickPackShipMode: 'NOPICK'
  };

  const saleOrder = await cin7Fetch(companyId, '/sale/order', { method: 'POST', body: JSON.stringify(saleOrderPayload) });
  const createdLines = saleOrder?.Lines || saleOrder?.Order?.Lines || [];
  if (!Array.isArray(createdLines) || createdLines.length === 0) {
    throw new Error(`Cin7 sale order endpoint returned zero lines. Payload: ${JSON.stringify(saleOrderPayload)} Response: ${JSON.stringify(saleOrder)}`);
  }

  await prisma.order.update({ where: { id: orderId }, data: { status: 'CREATED', cin7SaleId: saleId } });
  await learnFromSuccessfulOrder(orderId);

  return { sale, saleOrder };
}
