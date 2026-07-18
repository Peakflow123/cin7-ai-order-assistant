import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { syncCin7Company } from '@/lib/cin7-sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST() {
  try {
    const session = requireSession();
    const connection = await prisma.cin7Connection.findUnique({ where: { companyId: session.companyId } });
    if (!connection) return new NextResponse('Cin7 connection is not configured.', { status: 400 });

    const result = await syncCin7Company(session.companyId, { mode: 'manual-client', session });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Unknown Cin7 sync error' }, { status: 500 });
  }
}
