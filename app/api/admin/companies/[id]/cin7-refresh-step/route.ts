import { NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/auth';
import { syncCin7OnePage } from '@/lib/cin7-page-sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 20;

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    requirePlatformAdmin();
    const body = await request.json().catch(() => ({}));
    const entity = body.entity === 'Customer' ? 'Customer' : 'Product';
    const page = Number(body.page || 1);
    const since = body.since ? String(body.since) : null;

    const result = await syncCin7OnePage(params.id, entity, page, since);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : 'Admin Cin7 Core refresh step failed.' }, { status: 500 });
  }
}
