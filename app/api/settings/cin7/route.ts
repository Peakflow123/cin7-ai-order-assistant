import { NextResponse } from 'next/server';
import { requireSession, isPlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { encrypt } from '@/lib/crypto';
import { logActivity } from '@/lib/activity';

export async function POST(request: Request) {
  const session = requireSession();
  const body = await request.json().catch(() => ({}));
  const accountId = String(body.accountId || '').trim();
  const apiKey = String(body.apiKey || '').trim();
  const baseUrl = String(body.baseUrl || 'https://inventory.dearsystems.com/ExternalApi/v2').trim();

  if (!accountId) return new NextResponse('Cin7 Account ID is required.', { status: 400 });

  const company = await prisma.company.findUnique({ where: { id: session.companyId } });
  if (!company) return new NextResponse('Company not found.', { status: 404 });
  if (!isPlatformAdmin(session) && !company.allowClientCin7Edit) return new NextResponse('You do not have permission to edit Cin7 settings.', { status: 403 });

  const existing = await prisma.cin7Connection.findUnique({ where: { companyId: session.companyId } });
  if (!existing && !apiKey) return new NextResponse('Cin7 API Key is required for a new connection.', { status: 400 });

  await prisma.cin7Connection.upsert({
    where: { companyId: session.companyId },
    update: { accountId, baseUrl, ...(apiKey ? { apiKeyEncrypted: encrypt(apiKey) } : {}) },
    create: { companyId: session.companyId, accountId, baseUrl, apiKeyEncrypted: encrypt(apiKey) }
  });

  await logActivity({ session, companyId: session.companyId, action: 'CIN7_SETTINGS_UPDATED', entityType: 'Cin7Connection', message: 'Cin7 settings were updated.' });
  return new NextResponse('Cin7 settings saved successfully.');
}
