import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { createCin7SyncJob } from '@/lib/cin7-sync-job';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const session = requireSession();
    const job = await createCin7SyncJob(session.companyId, 'manual-client', session);
    return NextResponse.json(job);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Could not start Cin7 refresh.' }, { status: 500 });
  }
}
