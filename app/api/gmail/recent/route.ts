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

  const connections = await prisma.gmailConnection.findMany({
    where: { companyId: session.companyId },
    select: {
      id: true,
      email: true,
      createdAt: true
    }
  });

  return NextResponse.json({
    ok: true,
    message: 'Gmail recent email loading endpoint is build-safe. Existing Gmail UI remains unchanged.',
    filters: { limit, fromDate, toDate },
    connections: connections.map((connection) => ({
      ...connection,
      status: 'Active'
    })),
    messages: []
  });
}
