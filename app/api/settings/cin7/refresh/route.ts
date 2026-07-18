import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      message:
        'This old refresh endpoint is disabled. Reload the page and use the page-by-page Refresh Products & Customers flow.'
    },
    { status: 410 }
  );
}
