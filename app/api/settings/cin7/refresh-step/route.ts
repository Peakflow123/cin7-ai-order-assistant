import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { syncCin7Page } from '@/lib/cin7-page-sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 20;

export async function POST(request: Request) {
  try {
    const session = requireSession();
    const body = await request.json().catch(() => ({}));

    const entity = body.entity === 'Customer' ? 'Customer' : 'Product';
    const page = Number(body.page || 1);
    const since = body.since ? String(body.since) : null;

    const result = await syncCin7Page({
      companyId: session.companyId,
      entity,
      page,
      since
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : 'Cin7 Core refresh step failed.'
      },
      { status: 500 }
    );
  }
}
