import { NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { encrypt } from '@/lib/crypto';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  requirePlatformAdmin();
  const body = await request.json();

  if (!body.accountId) return new NextResponse('Cin7 Account ID is required.', { status: 400 });

  const existing = await prisma.cin7Connection.findUnique({ where: { companyId: params.id } });

  if (!existing && !body.apiKey) {
    return new NextResponse('API Key is required for first Cin7 connection.', { status: 400 });
  }

  await prisma.cin7Connection.upsert({
    where: { companyId: params.id },
    update: {
      accountId: body.accountId,
      ...(body.apiKey ? { apiKeyEncrypted: encrypt(body.apiKey) } : {})
    },
    create: {
      companyId: params.id,
      accountId: body.accountId,
      apiKeyEncrypted: encrypt(body.apiKey)
    }
  });

  return new NextResponse('Cin7 credentials saved by admin.');
}
