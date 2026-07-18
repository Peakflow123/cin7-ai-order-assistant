import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import { logActivity, logSystem } from '@/lib/activity';
import type { Session } from '@/lib/auth';

const DEFAULT_BASE_URL = 'https://inventory.dearsystems.com/ExternalApi/v2';
const PAGE_LIMIT = 500;
const MAX_PAGES = 20;

function normalizeBaseUrl(baseUrl?: string | null) {
  return String(baseUrl || DEFAULT_BASE_URL).replace(/\/$/, '');
}

function getId(item: Record<string, any>) {
  return String(item.ID || item.Id || item.id || '').trim();
}

function getModifiedDate(item: Record<string, any>) {
  const raw = item.LastModifiedOn || item.LastModified || item.UpdatedOn || item.ModifiedOn || item.LastUpdated;
  const date = raw ? new Date(raw) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function listFromResponse(data: any, key: 'Product' | 'Customer') {
  if (Array.isArray(data)) return data;
  if (key === 'Product') {
    if (Array.isArray(data.Products)) return data.Products;
    if (Array.isArray(data.ProductList)) return data.ProductList;
  }
  if (key === 'Customer') {
    if (Array.isArray(data.Customers)) return data.Customers;
    if (Array.isArray(data.CustomerList)) return data.CustomerList;
  }
  if (Array.isArray(data.Items)) return data.Items;
  return [];
}

async function cin7Get(connection: any, endpoint: 'Product' | 'Customer', page: number, since?: Date | null) {
  const url = new URL(`${normalizeBaseUrl(connection.baseUrl)}/${endpoint}`);
  url.searchParams.set('Page', String(page));
  url.searchParams.set('Limit', String(PAGE_LIMIT));

  // Cin7 Core may or may not honor this filter on all tenants/endpoints. Upsert still prevents duplicates.
  if (since) url.searchParams.set('LastModifiedOn', since.toISOString());

  const response = await fetch(url.toString(), {
    headers: {
      'api-auth-accountid': connection.accountId,
      'api-auth-applicationkey': decrypt(connection.apiKeyEncrypted),
      'Content-Type': 'application/json'
    },
    cache: 'no-store'
  });

  const text = await response.text();
  if (!response.ok) throw new Error(`Cin7 Core ${endpoint} API error ${response.status}: ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : {};
}

async function syncProducts(companyId: string, connection: any, since?: Date | null) {
  let fetched = 0;
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const data = await cin7Get(connection, 'Product', page, since);
    const rows = listFromResponse(data, 'Product');
    fetched += rows.length;

    for (const product of rows) {
      const cin7Id = getId(product);
      if (!cin7Id) { skipped += 1; continue; }

      const modified = getModifiedDate(product);
      if (since && modified && modified <= since) { skipped += 1; continue; }

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

    if (rows.length < PAGE_LIMIT) break;
  }

  return { fetched, created, updated, skipped };
}

async function syncCustomers(companyId: string, connection: any, since?: Date | null) {
  let fetched = 0;
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const data = await cin7Get(connection, 'Customer', page, since);
    const rows = listFromResponse(data, 'Customer');
    fetched += rows.length;

    for (const customer of rows) {
      const cin7Id = getId(customer);
      if (!cin7Id) { skipped += 1; continue; }

      const modified = getModifiedDate(customer);
      if (since && modified && modified <= since) { skipped += 1; continue; }

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

    if (rows.length < PAGE_LIMIT) break;
  }

  return { fetched, created, updated, skipped };
}

export async function syncCin7ProductsCustomers(companyId: string, options: { session?: Session | null; force?: boolean; source: 'client-manual' | 'admin-manual' | 'auto-24h' }) {
  const connection = await prisma.cin7Connection.findUnique({ where: { companyId } });
  if (!connection) throw new Error('Cin7 Core connection is not configured for this client.');

  const previous = await prisma.integrationSyncState.findUnique({ where: { companyId } }).catch(() => null);
  const productSince = options.force ? null : previous?.productsLastSyncedAt || null;
  const customerSince = options.force ? null : previous?.customersLastSyncedAt || null;
  const startedAt = new Date();

  const products = await syncProducts(companyId, connection, productSince);
  const customers = await syncCustomers(companyId, connection, customerSince);
  const message = `Products: ${products.created} created, ${products.updated} updated, ${products.skipped} skipped. Customers: ${customers.created} created, ${customers.updated} updated, ${customers.skipped} skipped.`;

  await prisma.integrationSyncState.upsert({
    where: { companyId },
    update: {
      productsLastSyncedAt: startedAt,
      customersLastSyncedAt: startedAt,
      lastSyncStatus: 'SUCCESS',
      lastSyncMessage: message
    },
    create: {
      companyId,
      productsLastSyncedAt: startedAt,
      customersLastSyncedAt: startedAt,
      lastSyncStatus: 'SUCCESS',
      lastSyncMessage: message
    }
  });

  await logActivity({
    session: options.session || null,
    companyId,
    action: options.source === 'auto-24h' ? 'CIN7_AUTO_SYNC_COMPLETED' : 'CIN7_MANUAL_SYNC_COMPLETED',
    entityType: 'Cin7Connection',
    message,
    metadata: { products, customers, source: options.source }
  });

  return { ok: true, products, customers, message, syncedAt: startedAt.toISOString() };
}

export async function syncDueCin7Companies() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const companies = await prisma.company.findMany({
    where: {
      isActive: true,
      isArchived: false,
      cin7: { isNot: null },
      OR: [
        { syncState: null },
        { syncState: { productsLastSyncedAt: null } },
        { syncState: { productsLastSyncedAt: { lt: cutoff } } }
      ]
    },
    select: { id: true, name: true },
    take: 3
  });

  const results: any[] = [];
  for (const company of companies) {
    try {
      const result = await syncCin7ProductsCustomers(company.id, { source: 'auto-24h' });
      results.push({ companyId: company.id, companyName: company.name, ok: true, result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Cin7 Core sync error';
      await logSystem({ companyId: company.id, level: 'ERROR', source: 'cin7-auto-sync', message, details: { companyId: company.id } });
      results.push({ companyId: company.id, companyName: company.name, ok: false, message });
    }
  }
  return results;
}
