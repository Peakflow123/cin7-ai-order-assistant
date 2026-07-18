import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      message:
        'This old admin refresh endpoint is disabled. Reload the admin clients page and use the page-by-page refresh button.'
    },
    { status: 410 }
  );
}
