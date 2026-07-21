import { prisma } from '@/lib/db';

function safeJson(value: unknown) {
  try { return JSON.stringify(value ?? {}); } catch { return '{}'; }
}

function safeId(id: string) {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new Error('Invalid id');
  return id;
}

export async function logActivity(input: {
  companyId?: string | null;
  actorUserId?: string | null;
  actorEmail?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  message: string;
  details?: unknown;
}) {
  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "ActivityLog" ("id", "companyId", "actorUserId", "actorEmail", "action", "targetType", "targetId", "message", "details")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)`,
      `act_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      input.companyId || null,
      input.actorUserId || null,
      input.actorEmail || null,
      input.action,
      input.targetType || null,
      input.targetId || null,
      input.message,
      safeJson(input.details)
    );
  } catch {
    // never break user flow because a monitoring insert failed
  }
}

export async function getLaunchSummary() {
  return prisma.$queryRawUnsafe<any[]>(`
    SELECT
      c."id",
      c."name",
      COALESCE(c."isActive", TRUE) as "isActive",
      COALESCE(c."isArchived", FALSE) as "isArchived",
      COALESCE(c."planName", 'Starter') as "planName",
      COALESCE(c."maxGmailConnections", 0) as "maxGmailConnections",
      COALESCE(c."maxOutlookConnections", 0) as "maxOutlookConnections",
      (SELECT COUNT(*)::int FROM "User" u WHERE u."companyId" = c."id") as "users",
      (SELECT COUNT(*)::int FROM "Order" o WHERE o."companyId" = c."id") as "orders",
      (SELECT COUNT(*)::int FROM "Order" o WHERE o."companyId" = c."id" AND o."status" = 'NEEDS_REVIEW') as "needsReview",
      (SELECT COUNT(*)::int FROM "Order" o WHERE o."companyId" = c."id" AND o."status" = 'CREATED') as "createdOrders",
      (SELECT COUNT(*)::int FROM "Order" o WHERE o."companyId" = c."id" AND o."status" = 'ERROR') as "errorOrders",
      (SELECT COUNT(*)::int FROM "GmailConnection" g WHERE g."companyId" = c."id" AND g."isActive" = TRUE) as "gmailConnections",
      (SELECT COUNT(*)::int FROM "OutlookConnection" oc WHERE oc."companyId" = c."id" AND oc."isActive" = TRUE) as "outlookConnections",
      (SELECT MAX(o."createdAt") FROM "Order" o WHERE o."companyId" = c."id") as "lastOrderAt"
    FROM "Company" c
    ORDER BY c."createdAt" DESC
    LIMIT 200
  `);
}

export async function getClientStorageRows() {
  const rows = await prisma.$queryRawUnsafe<any[]>(`
    SELECT
      c."id",
      c."name",
      (SELECT COUNT(*)::int FROM "Product" p WHERE p."companyId" = c."id") as "products",
      (SELECT COUNT(*)::int FROM "Customer" cu WHERE cu."companyId" = c."id") as "customers",
      (SELECT COUNT(*)::int FROM "Order" o WHERE o."companyId" = c."id") as "orders",
      (SELECT COUNT(*)::int FROM "OrderLine" ol JOIN "Order" o ON o."id" = ol."orderId" WHERE o."companyId" = c."id") as "orderLines",
      (SELECT COUNT(*)::int FROM "GmailConnection" g WHERE g."companyId" = c."id") as "gmailConnections",
      (SELECT COUNT(*)::int FROM "OutlookConnection" oc WHERE oc."companyId" = c."id") as "outlookConnections"
    FROM "Company" c
    ORDER BY c."createdAt" DESC
    LIMIT 200
  `);
  return rows.map((row) => {
    const estimatedBytes =
      Number(row.products || 0) * 1500 +
      Number(row.customers || 0) * 1300 +
      Number(row.orders || 0) * 2500 +
      Number(row.orderLines || 0) * 900 +
      Number(row.gmailConnections || 0) * 2000 +
      Number(row.outlookConnections || 0) * 2000;
    return { ...row, estimatedBytes, estimatedMb: Math.round((estimatedBytes / 1024 / 1024) * 100) / 100 };
  });
}

export async function permanentDeleteCompany(companyId: string) {
  const id = safeId(companyId).replace(/'/g, "''");
  const optionalTables = [
    'OrderAudit','ActivityLog','SystemLog','OrderFeedback','ProductAlias','CustomerAlias',
    'GmailConnection','OutlookConnection','Cin7Connection'
  ];
  for (const table of optionalTables) {
    try { await prisma.$executeRawUnsafe(`DELETE FROM "${table}" WHERE "companyId" = '${id}'`); } catch {}
  }
  await prisma.$executeRawUnsafe(`DELETE FROM "OrderLine" WHERE "orderId" IN (SELECT "id" FROM "Order" WHERE "companyId" = '${id}')`);
  await prisma.$executeRawUnsafe(`DELETE FROM "Order" WHERE "companyId" = '${id}'`);
  await prisma.$executeRawUnsafe(`DELETE FROM "Product" WHERE "companyId" = '${id}'`);
  await prisma.$executeRawUnsafe(`DELETE FROM "Customer" WHERE "companyId" = '${id}'`);
  await prisma.$executeRawUnsafe(`DELETE FROM "User" WHERE "companyId" = '${id}'`);
  await prisma.$executeRawUnsafe(`DELETE FROM "Company" WHERE "id" = '${id}'`);
}
