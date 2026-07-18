import { NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/auth';
import { syncCin7Company } from '@/lib/cin7-sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = requirePlatformAdmin();
    const body = await request.json().catch(() => ({}));
    const result = await syncCin7Company(params.id, { mode: 'manual-admin', session, forceFull: Boolean(body.forceFull) });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Unknown admin Cin7 sync error' }, { status: 500 });
  }
}
