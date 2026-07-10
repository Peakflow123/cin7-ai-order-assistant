import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { encrypt } from '@/lib/crypto';

export async function POST(request: Request) {
  const session = requireSession();
  const body = await request.json();

  await prisma.cin7Connection.upsert({
    where: { companyId: session.companyId },
    update: { accountId: body.accountId, apiKeyEncrypted: encrypt(body.apiKey) },
    create: { companyId: session.companyId, accountId: body.accountId, apiKeyEncrypted: encrypt(body.apiKey) }
  });

  return new NextResponse('Cin7 saved');
}
