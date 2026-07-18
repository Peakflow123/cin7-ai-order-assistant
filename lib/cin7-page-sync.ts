import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/crypto';

const DEFAULT_BASE_URL = 'https://inventory.dearsystems.com/ExternalApi/v2';
const PAGE_LIMIT = 250;

type Entity = 'Product' | 'Customer';

function normalizeBaseUrl(baseUrl?: string | null) {
  return String(baseUrl || DEFAULT_BASE_URL).replace(/\/$/, '');
}

function getId(item: Record<string, any>) {
  return String(item.ID || item.Id || item.id || item.ProductID || item.CustomerID || item.ProductId || item.CustomerId || '').trim();
}

function getModifiedDate(item: Record<string, any>) {
  const raw = item.LastModifiedOn || item.LastModified || item.UpdatedOn || item.ModifiedOn || item.LastUpdated;
  const date = raw ? new Date(raw) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function listFromResponse(data: any, entity: Entity) {
  if (Array.isArray(data)) return data;

  if (entity === 'Product') {
    if (Array.isArray(data.Products)) return data.Products;
    if (Array.isArray(data.ProductList)) return data.ProductList;
    if (Array.isArray(data.Product)) return data.Product;
  }

  if (entity === 'Customer') {
    if (Array.isArray(data.Customers)) return data.Customers;
    if (Array.isArray(data.CustomerList)) return data.CustomerList;
    if (Array.isArray(data.Customer)) return data.Customer;
  }

  if (Array.isArray(data.Items)) return data.Items;
  if (Array.isArray(data.Data)) return data.Data;
  return [];
}

async function cin7Get(connection: any, entity: Entity, page: number, since?: string | null) {
  const url = new URL(`${normalizeBaseUrl(connection.baseUrl)}/${entity}`);
  url.searchParams.set('Page', String(page));
  url.searchParams.set('Limit', String(PAGE_LIMIT));

  // Simple incremental attempt. If Cin7 Core ignores this, upsert still prevents duplicates.
  if (since) url.searchParams.set('LastModifiedOn', since);

  const response = await fetch(url.toString(), {
    headers: {
      'api-auth-accountid': connection.accountId,
      'api-auth-applicationkey': decrypt(connection.apiKeyEncrypted),
      'Content-Type': 'application/json'
    },
    cache: 'no-store'
  });

  const text = await response.text();
  if (!response.ok) throw new Error(`Cin7 Core ${entity} API error ${response.status}: ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : {};
}

async function syncProductRows(companyId: string, rows: any[], since?: string | null) {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const product of rows) {
    const cin7Id = getId(product);
    if (!cin7Id) { skipped += 1; continue; }

    const modified = getModifiedDate(product);
    if (since && modified && modified <= new Date(since)) { skipped += 1; continue; }

    const existing = await prisma.product.findUnique({ where: { companyId_cin7Id: { companyId, cin7Id } } });

    await prisma.product.upsert({
      where: { companyId_cin7Id: { companyId, cin7Id } },
      update: {
        sku: product.SKU || product.Sku || product.Code || null,
        name: product.Name || product.ProductName || product.SKU || 'Unnamed Product',
        barcode: product.Barcode || product.BarCode || null,
        uom: product.UnitOfMeasure || product.UOM || product.Uom || null,
        status: product.Status || null
      },
      create: {
        companyId,
        cin7Id,
        sku: product.SKU || product.Sku || product.Code || null,
        name: product.Name || product.ProductName || product.SKU || 'Unnamed Product',
        barcode: product.Barcode || product.BarCode || null,
        uom: product.UnitOfMeasure || product.UOM || product.Uom || null,
        status: product.Status || null
      }
    });

    if (existing) updated += 1;
    else created += 1;
  }

  return { created, updated, skipped };
}

async function syncCustomerRows(companyId: string, rows: any[], since?: string | null) {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const customer of rows) {
    const cin7Id = getId(customer);
    if (!cin7Id) { skipped += 1; continue; }

    const modified = getModifiedDate(customer);
    if (since && modified && modified <= new Date(since)) { skipped += 1; continue; }

    const contacts = Array.isArray(customer.Contacts) ? customer.Contacts : [];
    const firstContact = contacts[0] || {};
    const existing = await prisma.customer.findUnique({ where: { companyId_cin7Id: { companyId, cin7Id } } });

    await prisma.customer.upsert({
      where: { companyId_cin7Id: { companyId, cin7Id } },
      update: {
        name: customer.Name || customer.CustomerName || 'Unnamed Customer',
        email: customer.Email || firstContact.Email || null,
        phone: customer.Phone || firstContact.Phone || firstContact.MobilePhone || null
      },
      create: {
        companyId,
        cin7Id,
        name: customer.Name || customer.CustomerName || 'Unnamed Customer',
        email: customer.Email || firstContact.Email || null,
        phone: customer.Phone || firstContact.Phone || firstContact.MobilePhone || null
      }
    });

    if (existing) updated += 1;
    else created += 1;
  }

  return { created, updated, skipped };
}

export async function syncCin7OnePage(companyId: string, entity: Entity, page: number, since?: string | null) {
  const connection = await prisma.cin7Connection.findUnique({ where: { companyId } });
  if (!connection) throw new Error('Cin7 Core connection is not configured for this client.');

  const data = await cin7Get(connection, entity, page, since || null);
  const rows = listFromResponse(data, entity);
  const result = entity === 'Product'
    ? await syncProductRows(companyId, rows, since || null)
    : await syncCustomerRows(companyId, rows, since || null);

  return {
    entity,
    page,
    fetched: rows.length,
    done: rows.length < PAGE_LIMIT,
    ...result
  };
}

export async function completeCin7ManualSync(companyId: string, summary: any) {
  const now = new Date();
  const message = `Products: ${summary.productsCreated || 0} created, ${summary.productsUpdated || 0} updated, ${summary.productsSkipped || 0} skipped. Customers: ${summary.customersCreated || 0} created, ${summary.customersUpdated || 0} updated, ${summary.customersSkipped || 0} skipped.`;

  await prisma.integrationSyncState.upsert({
    where: { companyId },
    update: {
      productsLastSyncedAt: now,
      customersLastSyncedAt: now,
      lastSyncStatus: 'SUCCESS',
      lastSyncMessage: message
    },
    create: {
      companyId,
      productsLastSyncedAt: now,
      customersLastSyncedAt: now,
      lastSyncStatus: 'SUCCESS',
      lastSyncMessage: message
    }
  });

  return { ok: true, message, syncedAt: now.toISOString() };
}
