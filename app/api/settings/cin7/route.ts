import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { encrypt } from '@/lib/crypto';

const DEFAULT_BASE_URL = 'https://inventory.dearsystems.com/ExternalApi/v2';

async function readJson(request: Request) {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return request.json();
  const form = await request.formData();
  return Object.fromEntries(form.entries());
}

export async function GET() {
  const session = requireSession();
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT "id", "accountId", "baseUrl", "updatedAt" FROM "Cin7Connection" WHERE "companyId"=$1 LIMIT 1`,
    session.companyId
  );
  const companyRows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT COALESCE("allowClientEditCin7Settings", FALSE) AS "canEdit" FROM "Company" WHERE "id"=$1 LIMIT 1`,
    session.companyId
  );
  return NextResponse.json({
    connection: rows[0] || null,
    canEdit: Boolean(companyRows[0]?.canEdit) || rows.length === 0
  });
}

export async function POST(request: Request) {
  const session = requireSession();
  const body = await readJson(request);
  const accountId = String(body.accountId || body.cin7AccountId || '').trim();
  const apiKey = String(body.apiKey || body.cin7ApiKey || '').trim();

  if (!accountId) return NextResponse.json({ message: 'Cin7 Account ID is required.' }, { status: 400 });

  const existing = await prisma.$queryRawUnsafe<any[]>(
    `SELECT "id" FROM "Cin7Connection" WHERE "companyId"=$1 LIMIT 1`,
    session.companyId
  );
  const companyRows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT COALESCE("allowClientEditCin7Settings", FALSE) AS "canEdit" FROM "Company" WHERE "id"=$1 LIMIT 1`,
    session.companyId
  );
  const canEdit = Boolean(companyRows[0]?.canEdit) || existing.length === 0;

  if (existing.length > 0 && !canEdit) {
    return NextResponse.json({ message: 'Cin7 credentials are locked by admin. You can still refresh products and customers.' }, { status: 403 });
  }

  if (existing.length === 0) {
    if (!apiKey) return NextResponse.json({ message: 'Cin7 API Key is required for first connection.' }, { status: 400 });
    await prisma.$executeRawUnsafe(
      `INSERT INTO "Cin7Connection" ("id", "companyId", "accountId", "apiKeyEncrypted", "baseUrl", "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,$5,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
      randomUUID(),
      session.companyId,
      accountId,
      encrypt(apiKey),
      DEFAULT_BASE_URL
    );
  } else {
    if (apiKey) {
      await prisma.$executeRawUnsafe(
        `UPDATE "Cin7Connection" SET "accountId"=$1, "apiKeyEncrypted"=$2, "baseUrl"=$3, "updatedAt"=CURRENT_TIMESTAMP WHERE "companyId"=$4`,
        accountId,
        encrypt(apiKey),
        DEFAULT_BASE_URL,
        session.companyId
      );
    } else {
      await prisma.$executeRawUnsafe(
        `UPDATE "Cin7Connection" SET "accountId"=$1, "baseUrl"=$2, "updatedAt"=CURRENT_TIMESTAMP WHERE "companyId"=$3`,
        accountId,
        DEFAULT_BASE_URL,
        session.companyId
      );
    }
  }

  return NextResponse.json({ message: 'Cin7 connection saved.' });
}
