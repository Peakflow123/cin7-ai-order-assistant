import { NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/auth';
import { syncCin7ProductsCustomers } from '@/lib/cin7-simple-sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const session = requirePlatformAdmin();
    const result = await syncCin7ProductsCustomers(params.id, { session, source: 'admin-manual' });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : 'Admin Cin7 Core refresh failed.' }, { status: 500 });
  }
}
