import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = requireSession();
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get('limit') || 50), 100);
  const fromDate = searchParams.get('fromDate');
  const toDate = searchParams.get('toDate');

  const connections = await prisma.outlookConnection.findMany({
    where: { companyId: session.companyId },
    select: { id: true, email: true, status: true, createdAt: true }
  });

  return NextResponse.json({
    ok: true,
    message: 'Outlook recent email loading is available through the existing Outlook inbox UI. This endpoint is build-safe and ready for the next wiring step.',
    filters: { limit, fromDate, toDate },
    connections,
    messages: []
  });
}
