import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { completeCin7ManualSync } from '@/lib/cin7-page-sync';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = requireSession();
    const summary = await request.json().catch(() => ({}));
    const result = await completeCin7ManualSync(session.companyId, summary);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : 'Could not complete Cin7 sync.' }, { status: 500 });
  }
}
