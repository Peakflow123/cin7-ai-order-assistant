import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import { logActivity, logSystem } from '@/lib/activity';
import type { Session } from '@/lib/auth';

type SyncMode = 'manual-client' | 'manual-admin' | 'auto-24h';

type Cin7Product = Record<string, any>;
type Cin7Customer = Record<string, any>;

function normalizeBaseUrl(baseUrl?: string | null) {
  return String(baseUrl || 'https://inventory.dearsystems.com/ExternalApi/v2').replace(/\/$/, '');
}

function listFromResponse(data: any) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.Products)) return data.Products;
  if (Array.isArray(data.ProductList)) return data.ProductList;
  if (Array.isArray(data.Customers)) return data.Customers;
  if (Array.isArray(data.CustomerList)) return data.CustomerList;
  if (Array.isArray(data.Items)) return data.Items;
  return [];
}

function getId(item: Record<string, any>) {
  return String(item.ID || item.Id || item.id || item.ProductID || item.CustomerID || '').trim();
}

function getModifiedDate(item: Record<string, any>) {
  const raw = item.LastModifiedOn || item.LastModified || item.UpdatedOn || item.ModifiedOn || item.LastUpdated;
  const date = raw ? new Date(raw) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

async function cin7Get(connection: any, path: string, params: Record<string, string | number | undefined> = {}) {
  const baseUrl = normalizeBaseUrl(connection.baseUrl);
  const url = new URL(`${baseUrl}/${path.replace(/^\//, '')}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  });

  const response = await fetch(url.toString(), {
    headers: {
      'api-auth-accountid': connection.accountId,
      'api-auth-applicationkey': decrypt(connection.apiKeyEncrypted),
      'Content-Type': 'application/json'
    },
    cache: 'no-store'
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(`Cin7 API error ${response.status}: ${text.slice(0, 500)}`);
  return data;
}

async function fetchPaged(connection: any, endpoint: string, options: { since?: Date | null } = {}) {
  const all: any[] = [];
  const limit = 500;

  for (let page = 1; page <= 40; page += 1) {
    const params: Record<string, string | number | undefined> = { Page: page, Limit: limit };

    // If Cin7 Core accepts date filters on the tenant, this helps. If ignored, upsert still prevents duplicates.
    if (options.since) params.LastModifiedOn = options.since.toISOString();

    const data = await cin7Get(connection, endpoint, params);
    const rows = listFromResponse(data);
    all.push(...rows);

    if (rows.length < limit) break;
  }

  return all;
}

async function fetchWithFallback(connection: any, endpoints: string[], options: { since?: Date | null } = {}) {
  let lastError: any;
  for (const endpoint of endpoints) {
    try {
      return await fetchPaged(connection, endpoint, options);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function syncProducts(companyId: string, connection: any, since?: Date | null) {
  const rows = await fetchWithFallback(connection, ['Products', 'Product', 'ProductList'], { since });
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const product of rows as Cin7Product[]) {
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

  return { fetched: rows.length, created, updated, skipped };
}

async function syncCustomers(companyId: string, connection: any, since?: Date | null) {
  const rows = await fetchWithFallback(connection, ['Customers', 'Customer', 'CustomerList'], { since });
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const customer of rows as Cin7Customer[]) {
    const cin7Id = getId(customer);
    if (!cin7Id) { skipped += 1; continue; }

    const modified = getModifiedDate(customer);
    if (since && modified && modified <= since) { skipped += 1; continue; }

    const contacts = Array.isArray(customer.Contacts) ? customer.Contacts : [];
    const firstContact = contacts[0] || {};
    const email = customer.Email || firstContact.Email || null;
    const phone = customer.Phone || firstContact.Phone || firstContact.MobilePhone || null;

    const existing = await prisma.customer.findUnique({ where: { companyId_cin7Id: { companyId, cin7Id } } });
    await prisma.customer.upsert({
      where: { companyId_cin7Id: { companyId, cin7Id } },
      update: {
        name: customer.Name || customer.CustomerName || 'Unnamed Customer',
        email,
        phone
      },
      create: {
        companyId,
        cin7Id,
        name: customer.Name || customer.CustomerName || 'Unnamed Customer',
        email,
        phone
      }
    });

    if (existing) updated += 1;
    else created += 1;
  }

  return { fetched: rows.length, created, updated, skipped };
}

export async function syncCin7Company(companyId: string, options: { mode: SyncMode; session?: Session | null; forceFull?: boolean }) {
  const connection = await prisma.cin7Connection.findUnique({ where: { companyId } });
  if (!connection) throw new Error('Cin7 connection is not configured for this client.');

  const previous = await prisma.integrationSyncState.findUnique({ where: { companyId } });
  const useIncremental = !options.forceFull;
  const productSince = useIncremental ? previous?.productsLastSyncedAt || null : null;
  const customerSince = useIncremental ? previous?.customersLastSyncedAt || null : null;

  const startedAt = new Date();
  const products = await syncProducts(companyId, connection, productSince);
  const customers = await syncCustomers(companyId, connection, customerSince);

  await prisma.integrationSyncState.upsert({
    where: { companyId },
    update: {
      productsLastSyncedAt: startedAt,
      customersLastSyncedAt: startedAt,
      lastSyncStatus: 'SUCCESS',
      lastSyncMessage: `Products: ${products.created} created, ${products.updated} updated. Customers: ${customers.created} created, ${customers.updated} updated.`
    },
    create: {
      companyId,
      productsLastSyncedAt: startedAt,
      customersLastSyncedAt: startedAt,
      lastSyncStatus: 'SUCCESS',
      lastSyncMessage: `Products: ${products.created} created, ${products.updated} updated. Customers: ${customers.created} created, ${customers.updated} updated.`
    }
  });

  await logActivity({
    session: options.session || null,
    companyId,
    action: options.mode === 'auto-24h' ? 'CIN7_AUTO_SYNC_COMPLETED' : 'CIN7_MANUAL_SYNC_COMPLETED',
    entityType: 'Cin7Connection',
    message: `Cin7 sync completed. Products ${products.created} created, ${products.updated} updated. Customers ${customers.created} created, ${customers.updated} updated.`,
    metadata: { products, customers, mode: options.mode, incremental: useIncremental }
  });

  return { products, customers, incremental: useIncremental, syncedAt: startedAt.toISOString() };
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
    take: 20
  });

  const results: any[] = [];
  for (const company of companies) {
    try {
      const result = await syncCin7Company(company.id, { mode: 'auto-24h' });
      results.push({ companyId: company.id, companyName: company.name, ok: true, result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Cin7 sync error';
      await logSystem({ companyId: company.id, level: 'ERROR', source: 'cin7-auto-sync', message, details: { companyId: company.id } });
      results.push({ companyId: company.id, companyName: company.name, ok: false, message });
    }
  }

  return results;
}
