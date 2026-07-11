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

type SaleLineInput = {
  ProductID: string | null;
  SKU: string;
  Name: string;
  Quantity: number;
  Price: number;
  Discount: number;
  Tax: number;
  AverageCost: null;
  TaxRule: string;
  Comment: string;
  DropShip: boolean;
  BackorderQuantity: null;
  Total: number;
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

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
  return fallback;
}

function findPriceFromProductDetails(productDetails: any, priceTierFromSale: string | null) {
  const details = productDetails?.Products?.[0] || productDetails?.ProductList?.[0] || productDetails?.Product?.[0] || productDetails?.Product || productDetails;

  if (!details) return 0;

  const directPriceFields = [
    details.Price,
    details.SalePrice,
    details.SellPrice,
    details.RetailPrice,
    details.DefaultPrice,
    details.UnitPrice
  ];

  for (const field of directPriceFields) {
    const price = toNumber(field, NaN);
    if (Number.isFinite(price)) return price;
  }

  const possiblePriceTiers = details.PriceTiers || details.PriceTier || details.SellingPriceTiers || details.SalePrices || [];

  if (Array.isArray(possiblePriceTiers)) {
    const normalizedSaleTier = (priceTierFromSale || '').trim().toLowerCase();

    const matchingTier = possiblePriceTiers.find((tier: any) => {
      const tierName = String(tier.Name || tier.PriceTier || tier.Tier || tier.Description || '').trim().toLowerCase();
      return normalizedSaleTier && tierName === normalizedSaleTier;
    });

    if (matchingTier) {
      return toNumber(matchingTier.Price ?? matchingTier.Value ?? matchingTier.Amount ?? matchingTier.UnitPrice, 0);
    }

    const firstTier = possiblePriceTiers[0];
    if (firstTier) {
      return toNumber(firstTier.Price ?? firstTier.Value ?? firstTier.Amount ?? firstTier.UnitPrice, 0);
    }
  }

  return 0;
}

async function getProductPrice(companyId: string, productCin7Id: string | null, priceTierFromSale: string | null) {
  if (!productCin7Id) return 0;

  try {
    const productDetails = await cin7Fetch(companyId, `/product?ID=${encodeURIComponent(productCin7Id)}`);
    return findPriceFromProductDetails(productDetails, priceTierFromSale);
  } catch {
    return 0;
  }
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

  const matchedProducts = [];

  for (const line of order.lines) {
    if (!line.productId) continue;

    const product = await prisma.product.findUnique({ where: { id: line.productId } });
    if (!product) continue;

    matchedProducts.push({ line, product });
  }

  if (matchedProducts.length === 0) {
    throw new Error('No matched product lines found. Please make sure order lines are matched before creating Cin7 sale.');
  }

  /*
    Correct flow based on the successful Cin7 payload you provided:
    1. Create Sale header by POST /sale without Lines.
    2. Create/update Sales Order by PUT /sale/order with SaleID and Lines.
    The Sales Order payload requires SaleID, Lines, TotalBeforeTax, Tax, Total, TaxRule, Price, DropShip, etc.
  */
  const saleHeaderPayload = {
    CustomerID: customer?.cin7Id || undefined,
    Customer: customer?.name || order.customerText || 'Unknown Customer',
    CustomerReference: order.poNumber || order.subject || order.id,
    OrderStatus: 'NOTAUTHORISED',
    InvoiceStatus: 'NOTAUTHORISED',
    AutoPickPackShipMode: 'NOPICK',
    CurrencyRate: 1,
    Note: `Created by AI Order Assistant from ${order.source}`
  };

  const sale = await cin7Fetch(companyId, '/sale', {
    method: 'POST',
    body: JSON.stringify(saleHeaderPayload)
  });

  const saleId = sale.ID || sale.SaleID || sale.id;
  if (!saleId) {
    throw new Error(`Cin7 created sale header but did not return SaleID. Response: ${JSON.stringify(sale)}`);
  }

  const taxRule = sale.TaxRule || 'Tax Exempt (Sale)';
  const priceTier = sale.PriceTier || null;

  const lines: SaleLineInput[] = [];

  for (const item of matchedProducts) {
    const quantity = Number(item.line.quantity || 1);
    const price = await getProductPrice(companyId, item.product.cin7Id, priceTier);
    const tax = 0;
    const discount = 0;
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

  console.log('Cin7 Sale Header Payload:', JSON.stringify(saleHeaderPayload));
  console.log('Cin7 Sale Order Payload:', JSON.stringify(saleOrderPayload));

  const saleOrder = await cin7Fetch(companyId, '/sale/order', {
    method: 'PUT',
    body: JSON.stringify(saleOrderPayload)
  });

  const createdLines = saleOrder?.Lines || saleOrder?.Order?.Lines || [];

  if (!Array.isArray(createdLines) || createdLines.length === 0) {
    throw new Error(
      `Cin7 sale order endpoint returned zero lines. Payload: ${JSON.stringify(saleOrderPayload)} Response: ${JSON.stringify(saleOrder)}`
    );
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'CREATED',
      cin7SaleId: saleId
    }
  });

  return {
    sale,
    saleOrder
  };
}
