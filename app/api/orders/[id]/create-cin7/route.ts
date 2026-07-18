import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createCin7Sale } from '@/lib/cin7';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = requireSession();
  const body = await request.json().catch(() => ({}));
  const reviewFeedback = String(body.reviewFeedback || '').trim();

  const order = await prisma.order.findFirst({ where: { id: params.id, companyId: session.companyId } });
  if (!order) return new NextResponse('Order not found', { status: 404 });
  if (order.status === 'CREATED') return NextResponse.json({ ok: true, message: 'Order is already created in Cin7.', alreadyCreated: true });

  if (reviewFeedback) {
    await prisma.orderFeedback.create({
      data: {
        companyId: session.companyId,
        orderId: order.id,
        feedbackType: 'REVIEW_APPROVAL',
        comment: reviewFeedback,
        source: order.source,
        subject: order.subject || null,
        sender: order.sender || null,
        originalText: order.originalText || null
      } as any
    });
  }

  const result = await createCin7Sale(session.companyId, params.id);
  return NextResponse.json({ ok: true, message: 'Order created successfully in Cin7.', result });
}
