import { NextResponse } from 'next/server';
import { requireSession, isPlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = requireSession();
  const company = await prisma.company.findUnique({
    where: { id: session.companyId },
    include: { cin7: true }
  });

  if (!company) return new NextResponse('Company not found', { status: 404 });

  const connected = Boolean(company.cin7);
  const canEdit = !connected || company.allowClientCin7Edit || isPlatformAdmin(session);

  return NextResponse.json({
    connected,
    accountId: company.cin7?.accountId || null,
    canEdit,
    message: connected ? 'Cin7 connected' : 'Cin7 not connected'
  });
}
