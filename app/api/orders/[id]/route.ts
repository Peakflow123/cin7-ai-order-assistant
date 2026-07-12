import { NextResponse } from 'next/server';
import { requireSession, isPlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = requireSession();
  const order = await prisma.order.findFirst({
    where: { id: params.id, ...(isPlatformAdmin(session) ? {} : { companyId: session.companyId }) },
    include: { lines: true }
  });
  if (!order) return new NextResponse('Order not found', { status: 404 });

  const [customer, customers, products] = await Promise.all([
    order.customerId ? prisma.customer.findFirst({ where: { id: order.customerId, companyId: order.companyId } }) : null,
    prisma.customer.findMany({ where: { companyId: order.companyId }, orderBy: { name: 'asc' }, take: 1500 }),
    prisma.product.findMany({ where: { companyId: order.companyId }, orderBy: [{ sku: 'asc' }, { name: 'asc' }], take: 5000 })
  ]);

  return NextResponse.json({ order, customer, customers, products });
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = requireSession();
  const body = await request.json();
  const order = await prisma.order.findFirst({
    where: { id: params.id, ...(isPlatformAdmin(session) ? {} : { companyId: session.companyId }) },
    include: { lines: true }
  });
  if (!order) return new NextResponse('Order not found', { status: 404 });
  if (order.status === 'CREATED' || order.cin7SaleId) return new NextResponse('Order is already created in Cin7 and cannot be edited here.', { status: 400 });

  const customer = body.customerId ? await prisma.customer.findFirst({ where: { id: body.customerId, companyId: order.companyId } }) : null;
  await prisma.order.update({ where: { id: order.id }, data: { customerId: customer?.id || null, customerText: customer?.name || body.customerText || order.customerText, poNumber: body.poNumber || null, status: 'NEEDS_REVIEW' } });

  for (const lineInput of body.lines || []) {
    const product = lineInput.productId ? await prisma.product.findFirst({ where: { id: lineInput.productId, companyId: order.companyId } }) : null;
    await prisma.orderLine.update({ where: { id: lineInput.id }, data: { productId: product?.id || null, productName: product?.name || null, sku: product?.sku || null, quantity: Number(lineInput.quantity || 1), confidence: product ? 1 : 0, status: product ? 'MATCHED' : 'UNMATCHED' } });
  }

  return new NextResponse('Review changes saved successfully.');
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = requireSession();
  const body = await request.json().catch(() => ({ comment: '' }));
  const order = await prisma.order.findFirst({
    where: { id: params.id, ...(isPlatformAdmin(session) ? {} : { companyId: session.companyId }) },
    include: { lines: true }
  });

  if (!order) return new NextResponse('Order not found', { status: 404 });
  if (order.status === 'CREATED' || order.cin7SaleId) return new NextResponse('This order is already created in Cin7, so it cannot be deleted from review. Void/cancel it in Cin7 if needed.', { status: 400 });

  await prisma.orderFeedback.create({
    data: {
      companyId: order.companyId,
      feedbackType: 'NOT_ORDER',
      comment: String(body.comment || '').trim() || null,
      source: order.source,
      sourceAccount: order.sourceAccount,
      sender: order.sender,
      subject: order.subject,
      originalText: order.originalText.slice(0, 12000),
      sourceMessageId: order.sourceMessageId
    }
  });

  await prisma.order.delete({ where: { id: order.id } });

  return NextResponse.json({ message: 'Order deleted and feedback saved for AI learning.' });
}
