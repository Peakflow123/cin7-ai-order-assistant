import { NextResponse } from 'next/server';
import { requireSession, isPlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { encrypt } from '@/lib/crypto';

export async function POST(request: Request) {
  const session = requireSession();
  const body = await request.json();

  const company = await prisma.company.findUnique({
    where: { id: session.companyId },
    include: { cin7: true }
  });

  if (!company) return new NextResponse('Company not found', { status: 404 });

  const alreadyConnected = Boolean(company.cin7);
  const canEdit = !alreadyConnected || company.allowClientCin7Edit || isPlatformAdmin(session);

  if (!canEdit) {
    return new NextResponse('Cin7 credentials are locked after first connection. Please ask platform admin to change them.', { status: 403 });
  }

  if (!body.accountId || !body.apiKey) {
    return new NextResponse('Cin7 Account ID and API Key are required.', { status: 400 });
  }

  await prisma.cin7Connection.upsert({
    where: { companyId: session.companyId },
    update: {
      accountId: body.accountId,
      apiKeyEncrypted: encrypt(body.apiKey)
    },
    create: {
      companyId: session.companyId,
      accountId: body.accountId,
      apiKeyEncrypted: encrypt(body.apiKey)
    }
  });

  return new NextResponse('Cin7 credentials saved.');
}
