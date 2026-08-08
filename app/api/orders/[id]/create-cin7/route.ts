import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createCin7Sale } from '@/lib/cin7';
import { assertCanProcessOrder } from '@/lib/billing';

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const session = requireSession();
    await assertCanProcessOrder(session.companyId);

    const order = await prisma.order.findFirst({ where: { id: params.id, companyId: session.companyId } });
    if (!order) return NextResponse.json({ message: 'Order not found.' }, { status: 404 });
    if (order.cin7SaleId || order.status === 'CREATED') return NextResponse.json({ message: 'Order already created in Cin7.', orderId: order.id });

    const result = await createCin7Sale(session.companyId, order.id);
    return NextResponse.json({ message: 'Order created successfully in Cin7.', orderId: order.id, result });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Could not create Cin7 order.' }, { status: 500 });
  }
}
