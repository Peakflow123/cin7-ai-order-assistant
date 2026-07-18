import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = requireSession();
  const { searchParams } = new URL(request.url);
  const q = String(searchParams.get('q') || '').trim();

  if (q.length < 2) return NextResponse.json({ products: [] });

  const products = await prisma.product.findMany({
    where: {
      companyId: session.companyId,
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } }
      ]
    },
    orderBy: [{ sku: 'asc' }, { name: 'asc' }],
    take: 100,
    select: { id: true, sku: true, name: true }
  });

  return NextResponse.json({ products });
}
