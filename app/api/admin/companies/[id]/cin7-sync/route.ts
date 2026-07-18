import { NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/auth';
import { syncCin7Company } from '@/lib/cin7-sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const session = requirePlatformAdmin();
    const result = await syncCin7Company(params.id, { mode: 'manual-admin', session });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Unknown admin Cin7 sync error' }, { status: 500 });
  }
}
