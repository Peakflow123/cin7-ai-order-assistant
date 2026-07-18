import { NextResponse } from 'next/server';
import { syncDueCin7Companies } from '@/lib/cin7-simple-sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (!cronSecret) return NextResponse.json({ message: 'CRON_SECRET is missing.' }, { status: 500 });
  if (authHeader !== `Bearer ${cronSecret}`) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const results = await syncDueCin7Companies();
  return NextResponse.json({ ok: true, checkedAt: new Date().toISOString(), results });
}
