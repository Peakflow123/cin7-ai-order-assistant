import { NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/auth';
import { createCin7SyncJob } from '@/lib/cin7-sync-job';

export const dynamic = 'force-dynamic';

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const session = requirePlatformAdmin();
    const job = await createCin7SyncJob(params.id, 'manual-admin', session);
    return NextResponse.json(job);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Could not start admin Cin7 refresh.' }, { status: 500 });
  }
}
