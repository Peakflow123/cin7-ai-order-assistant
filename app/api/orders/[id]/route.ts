import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = requireSession();
  const order = await prisma.order.findFirst({
    where: { id: params.id, companyId: session.companyId },
    include: { lines: true }
  });

  return NextResponse.json(order);
}
