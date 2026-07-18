import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import { logActivity, logSystem } from '@/lib/activity';
import type { Session } from '@/lib/auth';

const PAGE_LIMIT = 100;
const MAX_PAGES_PER_RUN = 1;
const DEFAULT_BASE_URL = 'https://inventory.dearsystems.com/ExternalApi/v2';

function normalizeBaseUrl(baseUrl?: string | null) {
  return String(baseUrl || DEFAULT_BASE_URL).replace(/\/$/, '');
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

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 22000);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'api-auth-accountid': connection.accountId,
        'api-auth-applicationkey': decrypt(connection.apiKeyEncrypted),
        'Content-Type': 'application/json'
      },
      cache: 'no-store',
      signal: controller.signal
    });

    const text = await response.text();
    if (response.status === 429) {
      const retryAfter = response.headers.get('retry-after') || '60';
      const error: any = new Error(`Cin7 rate limit reached. Please wait ${retryAfter} seconds and try again.`);
      error.rateLimited = true;
      error.retryAfter = Number(retryAfter) || 60;
      throw error;
    }

    const data = text ? JSON.parse(text) : {};
    if (!response.ok) throw new Error(`Cin7 API error ${response.status}: ${text.slice(0, 500)}`);
    return data;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchPage(connection: any, endpoints: string[], page: number, since: Date | null) {
  let lastError: any;
  for (const endpoint of endpoints) {
    try {
      const params: Record<string, string | number | undefined> = { Page: page, Limit: PAGE_LIMIT };
      if (since) params.LastModifiedOn = since.toISOString();
      const data = await cin7Get(connection, endpoint, params);
      return listFromResponse(data);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function syncProductPage(companyId: string, connection: any, page: number, since: Date | null) {
  const rows = await fetchPage(connection, ['Products', 'Product', 'ProductList'], page, since);
  let created = 0, updated = 0, skipped = 0;

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
    if (existing) updated += 1; else created += 1;
  }

  return { fetched: rows.length, created, updated, skipped, done: rows.length < PAGE_LIMIT };
}

async function syncCustomerPage(companyId: string, connection: any, page: number, since: Date | null) {
  const rows = await fetchPage(connection, ['Customers', 'Customer', 'CustomerList'], page, since);
  let created = 0, updated = 0, skipped = 0;

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
    if (existing) updated += 1; else created += 1;
  }

  return { fetched: rows.length, created, updated, skipped, done: rows.length < PAGE_LIMIT };
}

export async function createCin7SyncJob(companyId: string, mode: string, session?: Session | null) {
  const connection = await prisma.cin7Connection.findUnique({ where: { companyId } });
  if (!connection) throw new Error('Cin7 connection is not configured for this client.');

  const existing = await prisma.cin7SyncJob.findFirst({
    where: { companyId, status: { in: ['PENDING', 'RUNNING', 'PAUSED'] } },
    orderBy: { createdAt: 'desc' }
  });

  if (existing) return existing;

  const job = await prisma.cin7SyncJob.create({
    data: { companyId, mode, message: 'Sync queued. Products and customers will refresh in small batches.' }
  });
  await logActivity({ session, companyId, action: 'CIN7_SYNC_QUEUED', entityType: 'Cin7SyncJob', entityId: job.id, message: 'Cin7 product/customer sync queued.' });
  return job;
}

export async function runCin7SyncJob(jobId: string, session?: Session | null) {
  let job = await prisma.cin7SyncJob.findUnique({ where: { id: jobId } });
  if (!job) throw new Error('Sync job not found.');
  if (job.status === 'COMPLETED' || job.status === 'FAILED') return job;

  const connection = await prisma.cin7Connection.findUnique({ where: { companyId: job.companyId } });
  if (!connection) throw new Error('Cin7 connection is not configured for this client.');

  const state = await prisma.integrationSyncState.findUnique({ where: { companyId: job.companyId } }).catch(() => null);
  const productSince = state?.productsLastSyncedAt || null;
  const customerSince = state?.customersLastSyncedAt || null;
  const startedAt = new Date();

  job = await prisma.cin7SyncJob.update({
    where: { id: job.id },
    data: { status: 'RUNNING', startedAt: job.startedAt || startedAt, error: null, message: `Syncing ${job.phase}, page ${job.page}...` }
  });

  try {
    for (let i = 0; i < MAX_PAGES_PER_RUN; i += 1) {
      if (job.phase === 'products') {
        const result = await syncProductPage(job.companyId, connection, job.page, productSince);
        job = await prisma.cin7SyncJob.update({
          where: { id: job.id },
          data: {
            productsFetched: { increment: result.fetched },
            productsCreated: { increment: result.created },
            productsUpdated: { increment: result.updated },
            productsSkipped: { increment: result.skipped },
            phase: result.done ? 'customers' : 'products',
            page: result.done ? 1 : job.page + 1,
            message: result.done ? 'Products finished. Starting customers...' : `Products page ${job.page} processed.`
          }
        });
      } else {
        const result = await syncCustomerPage(job.companyId, connection, job.page, customerSince);
        const completed = result.done;
        job = await prisma.cin7SyncJob.update({
          where: { id: job.id },
          data: {
            customersFetched: { increment: result.fetched },
            customersCreated: { increment: result.created },
            customersUpdated: { increment: result.updated },
            customersSkipped: { increment: result.skipped },
            page: completed ? job.page : job.page + 1,
            status: completed ? 'COMPLETED' : 'RUNNING',
            finishedAt: completed ? new Date() : null,
            message: completed ? 'Cin7 product/customer refresh completed.' : `Customers page ${job.page} processed.`
          }
        });
      }
    }

    if (job.status === 'COMPLETED') {
      const message = `Products: ${job.productsCreated} created, ${job.productsUpdated} updated, ${job.productsSkipped} skipped. Customers: ${job.customersCreated} created, ${job.customersUpdated} updated, ${job.customersSkipped} skipped.`;
      await prisma.integrationSyncState.upsert({
        where: { companyId: job.companyId },
        update: { productsLastSyncedAt: startedAt, customersLastSyncedAt: startedAt, lastSyncStatus: 'SUCCESS', lastSyncMessage: message },
        create: { companyId: job.companyId, productsLastSyncedAt: startedAt, customersLastSyncedAt: startedAt, lastSyncStatus: 'SUCCESS', lastSyncMessage: message }
      });
      await logActivity({ session, companyId: job.companyId, action: 'CIN7_SYNC_COMPLETED', entityType: 'Cin7SyncJob', entityId: job.id, message });
    }

    return job;
  } catch (error: any) {
    const isRateLimit = Boolean(error?.rateLimited);
    const message = error instanceof Error ? error.message : 'Unknown Cin7 sync error';
    const status = isRateLimit ? 'PAUSED' : 'FAILED';

    const failedJob = await prisma.cin7SyncJob.update({ where: { id: job.id }, data: { status, error: message, message } });
    await logSystem({ companyId: job.companyId, level: isRateLimit ? 'WARNING' : 'ERROR', source: 'cin7-sync', message, details: { jobId: job.id } });
    return failedJob;
  }
}

export async function runDueCin7SyncJobs() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const dueCompanies = await prisma.company.findMany({
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
    select: { id: true },
    take: 5
  });

  for (const company of dueCompanies) {
    await createCin7SyncJob(company.id, 'auto-24h');
  }

  const jobs = await prisma.cin7SyncJob.findMany({
    where: { status: { in: ['PENDING', 'RUNNING', 'PAUSED'] } },
    orderBy: { updatedAt: 'asc' },
    take: 5
  });

  const results = [];
  for (const job of jobs) {
    results.push(await runCin7SyncJob(job.id));
  }

  return results;
}
