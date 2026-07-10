import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { extractOrderWithAI, matchProduct } from '@/lib/ai';

export async function POST(request: Request) {
  const session = requireSession();
  const body = await request.json();
  const extracted = await extractOrderWithAI(body.text || '');

  const customer = extracted.customerText
    ? await prisma.customer.findFirst({
        where: { companyId: session.companyId, name: { contains: extracted.customerText, mode: 'insensitive' } }
      })
    : null;

  const order = await prisma.order.create({
    data: {
      companyId: session.companyId,
      source: body.source || 'email',
      originalText: body.text || '',
      customerText: extracted.customerText || null,
      customerId: customer?.id || null,
      poNumber: extracted.poNumber || null,
      status: 'NEEDS_REVIEW'
    }
  });

  for (const line of extracted.lines) {
    const match = await matchProduct(session.companyId, line.rawProductText, customer?.id);
    const confidence = match.confidence || 0;

    await prisma.orderLine.create({
      data: {
        orderId: order.id,
        rawProductText: line.rawProductText,
        quantity: Number(line.quantity || 1),
        uom: line.uom || null,
        productId: confidence >= 0.7 ? match.product?.id || null : null,
        productName: confidence >= 0.7 ? match.product?.name || null : null,
        sku: confidence >= 0.7 ? match.product?.sku || null : null,
        confidence,
        status: confidence >= 0.85 ? 'MATCHED' : confidence >= 0.7 ? 'NEEDS_REVIEW' : 'UNMATCHED'
      }
    });
  }

  return NextResponse.json({ id: order.id });
}
