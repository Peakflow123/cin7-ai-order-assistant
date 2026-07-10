import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { createCin7Sale } from '@/lib/cin7';

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const session = requireSession();

  try {
    const data = await createCin7Sale(session.companyId, params.id);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new NextResponse(message, { status: 500 });
  }
}
