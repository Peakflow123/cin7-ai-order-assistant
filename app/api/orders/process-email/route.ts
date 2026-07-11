import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { extractOrderWithAI, matchCustomer, matchProduct } from '@/lib/ai';
import { createCin7Sale } from '@/lib/cin7';

export async function POST(request: Request) {
  try {
    const session = requireSession();
    const body = await request.json();
    const text = body.text || '';
    const extracted = await extractOrderWithAI(text);

    const company = await prisma.company.findUnique({ where: { id: session.companyId } });
    if (!company) return new NextResponse('Company not found', { status: 404 });

    const sender = body.sender || null;
    const customerMatch = await matchCustomer(session.companyId, extracted.customerText, sender);
    const customer = customerMatch.customer;

    const order = await prisma.order.create({
      data: {
        companyId: session.companyId,
        source: body.source || 'manual-email',
        sourceMessageId: body.sourceMessageId || null,
        sender,
        subject: body.subject || null,
        originalText: text,
        customerText: extracted.customerText || null,
        customerId: customer?.id || null,
        poNumber: extracted.poNumber || null,
        status: 'NEEDS_REVIEW'
      }
    });

    const confidences: number[] = [];

    for (const line of extracted.lines) {
      const match = await matchProduct(session.companyId, line.rawProductText, customer?.id || null);
      const confidence = match.confidence || 0;
      confidences.push(confidence);

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

    const minimumConfidence = Math.min(customerMatch.confidence || 0, ...(confidences.length ? confidences : [0]));
    const canAutoCreate = Boolean(company.autoCreateEnabled && customer && extracted.lines.length > 0 && minimumConfidence >= company.autoCreateThreshold);

    if (canAutoCreate) {
      try {
        await createCin7Sale(session.companyId, order.id);
      } catch (error) {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'ERROR', error: error instanceof Error ? error.message : 'Auto-create failed' }
        });
      }
    }

    return NextResponse.json({ id: order.id, autoCreated: canAutoCreate, minimumConfidence });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new NextResponse(message, { status: 500 });
  }
}
