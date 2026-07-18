import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';

export async function POST() {
  requireSession();

  return NextResponse.json(
    {
      ok: false,
      message: 'This new Outlook process endpoint is temporarily disabled because the current lib/outlook.ts uses different helper names. Existing Outlook processing remains unchanged.'
    },
    { status: 501 }
  );
}
