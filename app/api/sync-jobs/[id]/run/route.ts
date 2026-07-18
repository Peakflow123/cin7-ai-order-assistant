import { NextResponse } from 'next/server';
import { requireSession, isPlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { runCin7SyncJob } from '@/lib/cin7-sync-job';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const session = requireSession();
    const job = await prisma.cin7SyncJob.findUnique({ where: { id: params.id } });
    if (!job) return new NextResponse('Sync job not found.', { status: 404 });
    if (!isPlatformAdmin(session) && job.companyId !== session.companyId) return new NextResponse('Forbidden', { status: 403 });

    const updated = await runCin7SyncJob(params.id, session);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Unknown sync error.' }, { status: 500 });
  }
}
