import { NextResponse } from 'next/server';
import { requireSession, isPlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = requireSession();
  const job = await prisma.cin7SyncJob.findUnique({ where: { id: params.id } });
  if (!job) return new NextResponse('Sync job not found.', { status: 404 });
  if (!isPlatformAdmin(session) && job.companyId !== session.companyId) return new NextResponse('Forbidden', { status: 403 });
  return NextResponse.json(job);
}
