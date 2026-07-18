import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = requireSession();
  const body = await request.json().catch(() => ({}));
  const comment = String(body.comment || '').trim();

  if (!comment) return NextResponse.json({ ok: true, skipped: true });

  const order = await prisma.order.findFirst({
    where: { id: params.id, companyId: session.companyId },
    include: { lines: true }
  });

  if (!order) return new NextResponse('Order not found', { status: 404 });

  await prisma.orderFeedback.create({
    data: {
      companyId: session.companyId,
      orderId: order.id,
      feedbackType: 'REVIEW_APPROVAL',
      comment,
      source: order.source,
      subject: order.subject || null,
      sender: order.sender || null,
      originalText: order.originalText || null
    } as any
  });

  return NextResponse.json({ ok: true });
}
