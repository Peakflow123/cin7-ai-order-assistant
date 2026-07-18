import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createCin7Sale } from '@/lib/cin7';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = requireSession();
    const body = await request.json().catch(() => ({}));
    const reviewFeedback = String(body.reviewFeedback || '').trim();

    const order = await prisma.order.findFirst({ where: { id: params.id, companyId: session.companyId } });
    if (!order) return NextResponse.json({ message: 'Order not found.' }, { status: 404 });
    if (order.status === 'CREATED' || order.cin7SaleId) return NextResponse.json({ message: 'This order already exists in Cin7. Duplicate creation is blocked.' });

    if (reviewFeedback) {
      await prisma.orderFeedback.create({
        data: {
          companyId: session.companyId,
          orderId: order.id,
          feedbackType: 'REVIEW_APPROVAL',
          comment: reviewFeedback,
          source: order.source,
          subject: order.subject,
          sender: order.sender,
          originalText: order.originalText
        } as any
      });
    }

    await createCin7Sale(session.companyId, order.id);
    return NextResponse.json({ message: 'Order created successfully in Cin7.' });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to create order in Cin7.' }, { status: 500 });
  }
}
