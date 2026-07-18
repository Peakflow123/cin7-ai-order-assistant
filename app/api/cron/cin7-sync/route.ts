import { NextResponse } from 'next/server';
import { runDueCin7SyncJobs } from '@/lib/cin7-sync-job';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (!cronSecret) return NextResponse.json({ message: 'CRON_SECRET is missing in Vercel environment variables.' }, { status: 500 });
  if (authHeader !== `Bearer ${cronSecret}`) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const results = await runDueCin7SyncJobs();
  return NextResponse.json({ ok: true, checkedAt: new Date().toISOString(), jobsProcessed: results.length, results });
}
