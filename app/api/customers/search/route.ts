import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = requireSession();
  const { searchParams } = new URL(request.url);
  const q = String(searchParams.get('q') || '').trim();

  if (q.length < 2) return NextResponse.json({ customers: [] });

  const customers = await prisma.customer.findMany({
    where: {
      companyId: session.companyId,
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } }
      ]
    },
    orderBy: { name: 'asc' },
    take: 25,
    select: { id: true, cin7Id: true, name: true, email: true, phone: true }
  });

  return NextResponse.json({ customers });
}
