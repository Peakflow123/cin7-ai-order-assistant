import { prisma } from '@/lib/db';

function json(value: unknown) {
  try { return JSON.stringify(value ?? {}); } catch { return '{}'; }
}

export async function logAdminActivity(input: {
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
      `INSERT INTO "ActivityLog" ("id", "companyId", "actorUserId", "actorEmail", "action", "targetType", "targetId", "message", "details") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)`,
      `act_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      input.companyId || null,
      input.actorUserId || null,
      input.actorEmail || null,
      input.action,
      input.targetType || null,
      input.targetId || null,
      input.message,
      json(input.details)
    );
  } catch {}
}

export async function getAdminClients() {
  return prisma.$queryRawUnsafe<any[]>(`
    SELECT
      c."id", c."name", c."createdAt",
      COALESCE(c."isActive", TRUE) AS "isActive",
      COALESCE(c."isArchived", FALSE) AS "isArchived",
      c."archivedAt",
      COALESCE(c."planName", 'Starter') AS "planName",
      c."monthlyOrderLimit",
      COALESCE(c."maxGmailConnections", 1) AS "maxGmailConnections",
      COALESCE(c."maxOutlookConnections", 1) AS "maxOutlookConnections",
      COALESCE(c."allowClientEditCin7Settings", FALSE) AS "allowClientEditCin7Settings",
      COALESCE(c."allowClientReconnectEmail", TRUE) AS "allowClientReconnectEmail",
      COALESCE(c."autoCreateEnabled", FALSE) AS "autoCreateEnabled",
      COALESCE(c."autoCreateThreshold", 0.95) AS "autoCreateThreshold",
      c."adminNotes",
      (SELECT COUNT(*)::int FROM "User" u WHERE u."companyId" = c."id") AS "users",
      (SELECT COUNT(*)::int FROM "GmailConnection" g WHERE g."companyId" = c."id" AND g."isActive" = TRUE) AS "gmailConnections",
      (SELECT COUNT(*)::int FROM "OutlookConnection" o WHERE o."companyId" = c."id" AND o."isActive" = TRUE) AS "outlookConnections",
      (SELECT COUNT(*)::int FROM "Product" p WHERE p."companyId" = c."id") AS "products",
      (SELECT COUNT(*)::int FROM "Customer" cu WHERE cu."companyId" = c."id") AS "customers",
      (SELECT COUNT(*)::int FROM "Order" ord WHERE ord."companyId" = c."id") AS "orders",
      (SELECT COUNT(*)::int FROM "Order" ord WHERE ord."companyId" = c."id" AND ord."status" = 'NEEDS_REVIEW') AS "needsReview",
      (SELECT COUNT(*)::int FROM "Order" ord WHERE ord."companyId" = c."id" AND ord."status" = 'CREATED') AS "createdOrders",
      (SELECT COUNT(*)::int FROM "Order" ord WHERE ord."companyId" = c."id" AND ord."status" = 'ERROR') AS "errorOrders",
      (SELECT COUNT(*)::int FROM "OrderFeedback" f WHERE f."companyId" = c."id") AS "feedbackCount"
    FROM "Company" c
    ORDER BY c."createdAt" DESC
    LIMIT 250
  `);
}

export function estimateStorageMb(row: any) {
  const bytes =
    Number(row.products || 0) * 1500 +
    Number(row.customers || 0) * 1300 +
    Number(row.orders || 0) * 2500 +
    Number(row.feedbackCount || 0) * 900 +
    Number(row.gmailConnections || 0) * 2000 +
    Number(row.outlookConnections || 0) * 2000;
  return Math.round((bytes / 1024 / 1024) * 100) / 100;
}
