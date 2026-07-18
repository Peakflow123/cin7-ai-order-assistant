import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { syncCin7ProductsCustomers } from '@/lib/cin7-simple-sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST() {
  try {
    const session = requireSession();
    const result = await syncCin7ProductsCustomers(session.companyId, { session, source: 'client-manual' });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : 'Cin7 Core refresh failed.' }, { status: 500 });
  }
}
