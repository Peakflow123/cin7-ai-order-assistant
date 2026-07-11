import { NextResponse } from 'next/server';
import { requireSession, isPlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createCin7Sale } from '@/lib/cin7';

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const session = requireSession();

  const order = await prisma.order.findFirst({
    where: {
      id: params.id,
      ...(isPlatformAdmin(session) ? {} : { companyId: session.companyId })
    }
  });

  if (!order) {
    return NextResponse.json({ message: 'Order not found.' }, { status: 404 });
  }

  if (order.status === 'CREATED' || order.cin7SaleId) {
    return NextResponse.json(
      {
        message: 'This order has already been created in Cin7. Duplicate creation is blocked.',
        cin7SaleId: order.cin7SaleId
      },
      { status: 409 }
    );
  }

  try {
    await createCin7Sale(order.companyId, params.id);

    const updated = await prisma.order.findUnique({ where: { id: params.id } });

    return NextResponse.json({
      message: 'Order created successfully in Cin7.',
      cin7SaleId: updated?.cin7SaleId || null
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    await prisma.order.update({
      where: { id: params.id },
      data: { status: 'ERROR', error: message }
    });

    return NextResponse.json({ message }, { status: 500 });
  }
}
