import { NextResponse } from 'next/server';
import { requireSession, isPlatformAdmin } from '@/lib/auth';
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

  const company = await prisma.company.findUnique({ where: { id: session.companyId } });
  if (!company) return new NextResponse('Company not found.', { status: 404 });

  const existing = await prisma.cin7Connection.findUnique({ where: { companyId: session.companyId } });

  if (existing && !isPlatformAdmin(session) && !company.allowClientCin7Edit) {
    return new NextResponse('Cin7 connection is locked. Please ask the admin to allow editing.', { status: 403 });
  }

  if (!existing && !apiKey) return new NextResponse('Cin7 API Key is required for the first setup.', { status: 400 });

  await prisma.cin7Connection.upsert({
    where: { companyId: session.companyId },
    update: { accountId, baseUrl: DEFAULT_BASE_URL, ...(apiKey ? { apiKeyEncrypted: encrypt(apiKey) } : {}) },
    create: { companyId: session.companyId, accountId, baseUrl: DEFAULT_BASE_URL, apiKeyEncrypted: encrypt(apiKey) }
  });

  await logActivity({ session, companyId: session.companyId, action: existing ? 'CIN7_SETTINGS_UPDATED' : 'CIN7_CONNECTION_CREATED', entityType: 'Cin7Connection', message: existing ? 'Cin7 settings were updated.' : 'Cin7 connection was created.' });
  return new NextResponse(existing ? 'Cin7 settings updated successfully.' : 'Cin7 connection saved successfully.');
}
