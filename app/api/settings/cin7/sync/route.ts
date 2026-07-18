import { NextResponse } from 'next/server';
import { requireSession, isPlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { syncCin7Company } from '@/lib/cin7-sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const session = requireSession();
    const body = await request.json().catch(() => ({}));
    const forceFull = Boolean(body.forceFull);

    const company = await prisma.company.findUnique({ where: { id: session.companyId } });
    if (!company) return new NextResponse('Company not found.', { status: 404 });

    if (!isPlatformAdmin(session) && !company.allowClientCin7Edit) {
      return new NextResponse('You do not have permission to refresh Cin7 data.', { status: 403 });
    }

    const result = await syncCin7Company(session.companyId, { mode: 'manual-client', session, forceFull });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Unknown Cin7 sync error' }, { status: 500 });
  }
}
