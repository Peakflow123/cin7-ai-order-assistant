import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/crypto';

const DEFAULT_BASE_URL = 'https://inventory.dearsystems.com/ExternalApi/v2';

// IMPORTANT: Small batch size is intentional for Vercel.
// Larger batches can finish the Cin7 GET but still timeout while saving rows to Supabase.
const PAGE_LIMIT = 10;
const MAX_FRONTEND_PAGES = 500;

type Entity = 'Product' | 'Customer';

function cleanBaseUrl(baseUrl?: string | null) {
  return String(baseUrl || DEFAULT_BASE_URL).replace(/\/$/, '');
}

function listFromCin7Response(data: any, entity: Entity): any[] {
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

function getCin7Id(item: Record<string, any>) {
  return String(
    item.ID || item.Id || item.id || item.ProductID || item.ProductId || item.CustomerID || item.CustomerId || ''
  ).trim();
}

function getModifiedDate(item: Record<string, any>) {
  const raw = item.LastModifiedOn || item.LastModified || item.UpdatedOn || item.ModifiedOn || item.LastUpdated;
  const date = raw ? new Date(raw) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function shouldSkipBecauseNotModified(item: Record<string, any>, since?: string | null) {
  if (!since) return false;
  const modified = getModifiedDate(item);
  if (!modified) return false;
  return modified <= new Date(since);
}

async function getCin7Page(connection: any, entity: Entity, page: number, since?: string | null) {
  const url = new URL(`${cleanBaseUrl(connection.baseUrl)}/${entity}`);
  url.searchParams.set('Page', String(page));
  url.searchParams.set('Limit', String(PAGE_LIMIT));
  if (since) url.searchParams.set('LastModifiedOn', since);

  const response = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json',
      'api-auth-accountid': connection.accountId,
      'api-auth-applicationkey': decrypt(connection.apiKeyEncrypted)
    },
    cache: 'no-store'
  });

  const text = await response.text();
  if (!response.ok) throw new Error(`Cin7 Core ${entity} request failed ${response.status}: ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : {};
}

async function saveProductRows(companyId: string, rows: any[], since?: string | null) {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const item of rows) {
    const cin7Id = getCin7Id(item);
    if (!cin7Id) { skipped += 1; continue; }
    if (shouldSkipBecauseNotModified(item, since)) { skipped += 1; continue; }

    const existing = await prisma.product.findUnique({ where: { companyId_cin7Id: { companyId, cin7Id } } });

    await prisma.product.upsert({
      where: { companyId_cin7Id: { companyId, cin7Id } },
      update: {
        sku: item.SKU || item.Sku || item.Code || null,
        name: item.Name || item.ProductName || item.SKU || item.Code || 'Unnamed Product',
        barcode: item.Barcode || item.BarCode || null,
        uom: item.UnitOfMeasure || item.UOM || item.Uom || null,
        status: item.Status || null
      },
      create: {
        companyId,
        cin7Id,
        sku: item.SKU || item.Sku || item.Code || null,
        name: item.Name || item.ProductName || item.SKU || item.Code || 'Unnamed Product',
        barcode: item.Barcode || item.BarCode || null,
        uom: item.UnitOfMeasure || item.UOM || item.Uom || null,
        status: item.Status || null
      }
    });

    if (existing) updated += 1;
    else created += 1;
  }

  return { created, updated, skipped };
}

async function saveCustomerRows(companyId: string, rows: any[], since?: string | null) {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const item of rows) {
    const cin7Id = getCin7Id(item);
    if (!cin7Id) { skipped += 1; continue; }
    if (shouldSkipBecauseNotModified(item, since)) { skipped += 1; continue; }

    const contacts = Array.isArray(item.Contacts) ? item.Contacts : [];
    const firstContact = contacts[0] || {};
    const existing = await prisma.customer.findUnique({ where: { companyId_cin7Id: { companyId, cin7Id } } });

    await prisma.customer.upsert({
      where: { companyId_cin7Id: { companyId, cin7Id } },
      update: {
        name: item.Name || item.CustomerName || 'Unnamed Customer',
        email: item.Email || firstContact.Email || null,
        phone: item.Phone || firstContact.Phone || firstContact.MobilePhone || null
      },
      create: {
        companyId,
        cin7Id,
        name: item.Name || item.CustomerName || 'Unnamed Customer',
        email: item.Email || firstContact.Email || null,
        phone: item.Phone || firstContact.Phone || firstContact.MobilePhone || null
      }
    });

    if (existing) updated += 1;
    else created += 1;
  }

  return { created, updated, skipped };
}

export async function syncCin7Page(params: { companyId: string; entity: Entity; page: number; since?: string | null }) {
  if (params.page < 1 || params.page > MAX_FRONTEND_PAGES) throw new Error('Invalid Cin7 page number.');

  const connection = await prisma.cin7Connection.findUnique({ where: { companyId: params.companyId } });
  if (!connection) throw new Error('Cin7 Core connection is not configured.');

  const raw = await getCin7Page(connection, params.entity, params.page, params.since || null);
  const rows = listFromCin7Response(raw, params.entity);

  const result = params.entity === 'Product'
    ? await saveProductRows(params.companyId, rows, params.since || null)
    : await saveCustomerRows(params.companyId, rows, params.since || null);

  return {
    entity: params.entity,
    page: params.page,
    fetched: rows.length,
    done: rows.length < PAGE_LIMIT,
    created: result.created,
    updated: result.updated,
    skipped: result.skipped,
    batchSize: PAGE_LIMIT
  };
}

export async function completeCin7Refresh(companyId: string, summary: any) {
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
