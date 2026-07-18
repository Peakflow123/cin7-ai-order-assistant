import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { encrypt } from '@/lib/crypto';

const DEFAULT_BASE_URL = 'https://inventory.dearsystems.com/ExternalApi/v2';

export async function POST(request: Request) {
  const session = requireSession();
  const body = await request.json().catch(() => ({}));

  const accountId = String(body.accountId || '').trim();
  const apiKey = String(body.apiKey || '').trim();

  if (!accountId) return new NextResponse('Cin7 Account ID is required.', { status: 400 });
  if (!apiKey) return new NextResponse('Cin7 API Key is required.', { status: 400 });

  await prisma.cin7Connection.upsert({
    where: {
      companyId: session.companyId
    },
    update: {
      accountId,
      apiKeyEncrypted: encrypt(apiKey),
      baseUrl: DEFAULT_BASE_URL
    },
    create: {
      companyId: session.companyId,
      accountId,
      apiKeyEncrypted: encrypt(apiKey),
      baseUrl: DEFAULT_BASE_URL
    }
  });

  return new NextResponse('Cin7 Core connection saved successfully.');
}
