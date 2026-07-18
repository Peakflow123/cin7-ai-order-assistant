import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';

export async function POST() {
  requireSession();

  return NextResponse.json(
    {
      ok: false,
      message: 'This new Gmail process endpoint is temporarily disabled because the current lib/gmail.ts uses different helper names. Existing Gmail processing remains unchanged.'
    },
    { status: 501 }
  );
}
