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

function toNumber(value: unknown, fallback = NaN) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
  return fallback;
}

function normalize(value: unknown) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function unwrapProductDetails(productDetails: any) {
  return (
    productDetails?.Products?.[0] ||
    productDetails?.ProductList?.[0] ||
    productDetails?.Product?.[0] ||
    productDetails?.Product ||
    productDetails
  );
}

function getObjectPaths(source: any, prefix = '', depth = 0): Array<{ path: string; value: any }> {
  if (!source || typeof source !== 'object' || depth > 4) return [];

  const paths: Array<{ path: string; value: any }> = [];

  for (const key of Object.keys(source)) {
    const value = source[key];
    const path = prefix ? `${prefix}.${key}` : key;
    paths.push({ path, value });

    if (value && typeof value === 'object') {
      paths.push(...getObjectPaths(value, path, depth + 1));
    }
  }

  return paths;
}

function findPriceByCustomerTier(productDetails: any, customerPriceTier: string | null) {
  const product = unwrapProductDetails(productDetails);
  const tierName = customerPriceTier || '';
  const normalizedTier = normalize(tierName);

  if (!product) return NaN;

  /*
    Cin7 Core has up to 10 price points per product. Customers are assigned a price tier,
    and the sale order price tier/customer price tier determines which product price to use.
    This resolver intentionally searches many possible API response shapes because Cin7/API
    responses can expose price tiers as arrays, objects, or numbered fields depending on endpoint/version.
  */

  const possibleArrays = [
    product.PriceTiers,
    product.PriceTier,
    product.Prices,
    product.SalePrices,
    product.SellingPrices,
    product.SellingPriceTiers,
    product.ProductPrices
  ];

  for (const arr of possibleArrays) {
    if (!Array.isArray(arr)) continue;

    const match = arr.find((item: any) => {
      const possibleNames = [
        item.Name,
        item.PriceTier,
        item.Tier,
        item.TierName,
        item.Description,
        item.Key,
        item.Label
      ];
      return possibleNames.some((name) => normalize(name) === normalizedTier);
    });

    if (match) {
      const price = toNumber(match.Price ?? match.Value ?? match.Amount ?? match.UnitPrice ?? match.SalePrice);
      if (Number.isFinite(price)) return price;
    }
  }

  const possibleObjects = [
    product.PriceTiers,
    product.PriceTier,
    product.Prices,
    product.SalePrices,
    product.SellingPrices,
    product.SellingPriceTiers,
    product.ProductPrices
  ];

  for (const obj of possibleObjects) {
    if (!obj || Array.isArray(obj) || typeof obj !== 'object') continue;

    for (const key of Object.keys(obj)) {
      if (normalize(key) === normalizedTier) {
        const price = toNumber(obj[key]);
        if (Number.isFinite(price)) return price;

        if (obj[key] && typeof obj[key] === 'object') {
          const nestedPrice = toNumber(
            obj[key].Price ?? obj[key].Value ?? obj[key].Amount ?? obj[key].UnitPrice ?? obj[key].SalePrice
          );
          if (Number.isFinite(nestedPrice)) return nestedPrice;
        }
      }
    }
  }

  const allPaths = getObjectPaths(product);

  /* Match direct field names like Retail, RetailPrice, Retail_Price, Retail Price, etc. */
  for (const entry of allPaths) {
    const pathName = normalize(entry.path);
    const price = toNumber(entry.value);

    if (!Number.isFinite(price)) continue;
    if (pathName === normalizedTier || pathName.endsWith(normalizedTier) || pathName.includes(`${normalizedTier}price`)) {
      return price;
    }
  }

  /* If tier is explicitly numeric, e.g. Price Tier 3, use PriceTier3. */
  const tierNumberMatch = String(tierName).match(/(\d+)/);
  if (tierNumberMatch) {
    const tierNumber = tierNumberMatch[1];
    const numberedCandidates = [
      `PriceTier${tierNumber}`,
      `PriceTier${tierNumber}Price`,
      `Tier${tierNumber}`,
      `Tier${tierNumber}Price`,
      `Price${tierNumber}`
    ];

    for (const field of numberedCandidates) {
      const price = toNumber(product[field]);
      if (Number.isFinite(price)) return price;
    }
  }

  /* Last resort: if the product response exposes numbered price fields, return the first non-zero price. */
  for (let i = 1; i <= 10; i += 1) {
    const candidates = [
      product[`PriceTier${i}`],
      product[`PriceTier${i}Price`],
      product[`Tier${i}`],
      product[`Tier${i}Price`],
      product[`Price${i}`]
    ];

    for (const candidate of candidates) {
      const price = toNumber(candidate);
      if (Number.isFinite(price) && price > 0) return price;
    }
  }

  return NaN;
}

async function getProductPrice(companyId: string, productCin7Id: string | null, customerPriceTier: string | null) {
  if (!productCin7Id) {
    throw new Error('Cannot get price because product Cin7 ID is missing.');
  }

  const productDetails = await cin7Fetch(companyId, `/product?ID=${encodeURIComponent(productCin7Id)}`);
  const price = findPriceByCustomerTier(productDetails, customerPriceTier);

  if (!Number.isFinite(price)) {
    const product = unwrapProductDetails(productDetails);
    const keys = product && typeof product === 'object' ? Object.keys(product).slice(0, 80) : [];
    throw new Error(
      `Could not find product price for customer price tier "${customerPriceTier}". ProductID: ${productCin7Id}. Product response keys: ${JSON.stringify(keys)}. Please send the GET /product response so the exact Cin7 price field can be mapped.`
    );
  }

  return price;
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

  const customerPriceTier = sale.PriceTier || null;
  const taxRule = sale.TaxRule || 'Tax Exempt (Sale)';

  if (!customerPriceTier) {
    throw new Error(`Cin7 sale response did not return customer PriceTier. Response: ${JSON.stringify(sale)}`);
  }

  const lines: SaleLineInput[] = [];

  for (const item of matchedProducts) {
    const quantity = Number(item.line.quantity || 1);
    const price = await getProductPrice(companyId, item.product.cin7Id, customerPriceTier);
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

  const totalBeforeTax = Number(
    lines.reduce((sum, line) => sum + line.Quantity * line.Price - line.Discount, 0).toFixed(4)
  );
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
  console.log('Customer price tier from Cin7 sale:', customerPriceTier);
  console.log('Cin7 Sale Order Payload:', JSON.stringify(saleOrderPayload));

  const saleOrder = await cin7Fetch(companyId, '/sale/order', {
    method: 'POST',
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
