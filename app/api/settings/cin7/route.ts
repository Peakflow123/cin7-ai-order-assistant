import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { encrypt } from '@/lib/crypto';
import { logActivity } from '@/lib/activity';

const DEFAULT_BASE_URL = 'https://inventory.dearsystems.com/ExternalApi/v2';

export async function POST(request: Request) {
  const session = requireSession();
  const body = await request.json().catch(() => ({}));
  const accountId = String(body.accountId || '').trim();
  const apiKey = String(body.apiKey || '').trim();

  if (!accountId) return new NextResponse('Cin7 Account ID is required.', { status: 400 });
  if (!apiKey) return new NextResponse('Cin7 API Key is required.', { status: 400 });

  const existing = await prisma.cin7Connection.findUnique({ where: { companyId: session.companyId } });

  await prisma.cin7Connection.upsert({
    where: { companyId: session.companyId },
    update: { accountId, apiKeyEncrypted: encrypt(apiKey), baseUrl: DEFAULT_BASE_URL },
    create: { companyId: session.companyId, accountId, apiKeyEncrypted: encrypt(apiKey), baseUrl: DEFAULT_BASE_URL }
  });

  await logActivity({
    session,
    companyId: session.companyId,
    action: existing ? 'CIN7_SETTINGS_UPDATED' : 'CIN7_CONNECTION_CREATED',
    entityType: 'Cin7Connection',
    message: existing ? 'Cin7 Core settings were updated.' : 'Cin7 Core connection was created.'
  });

  return new NextResponse(existing ? 'Cin7 Core settings updated successfully.' : 'Cin7 Core connection saved successfully.');
}
