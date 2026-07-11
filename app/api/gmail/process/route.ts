import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { extractOrderWithAI, matchCustomer, matchProduct } from '@/lib/ai';
import { createCin7Sale } from '@/lib/cin7';
import { getGmailMessageText } from '@/lib/gmail';

function extractEmailAddress(from: string) {
  const match = from.match(/<([^>]+)>/);
  return (match?.[1] || from || '').trim();
}

export async function POST(request: Request) {
  try {
    const session = requireSession();
    const body = await request.json();
    const connectionId = body.connectionId;
    const messageId = body.messageId;

    if (!connectionId || !messageId) {
      return new NextResponse('connectionId and messageId are required', { status: 400 });
    }

    const sourceMessageId = `gmail:${connectionId}:${messageId}`;
    const existingOrder = await prisma.order.findFirst({
      where: {
        companyId: session.companyId,
        sourceMessageId
      }
    });

    if (existingOrder) {
      return NextResponse.json({
        message: 'This Gmail message has already been processed.',
        orderId: existingOrder.id,
        alreadyProcessed: true
      });
    }

    const company = await prisma.company.findUnique({ where: { id: session.companyId } });
    if (!company) return new NextResponse('Company not found', { status: 404 });

    const gmailMessage = await getGmailMessageText(connectionId, session.companyId, messageId);
    const extracted = await extractOrderWithAI(gmailMessage.bodyText);
    const senderEmail = extractEmailAddress(gmailMessage.from);
    const customerMatch = await matchCustomer(session.companyId, extracted.customerText, senderEmail);
    const customer = customerMatch.customer;

    const order = await prisma.order.create({
      data: {
        companyId: session.companyId,
        source: 'gmail',
        sourceMessageId,
        sender: senderEmail,
        subject: gmailMessage.subject,
        originalText: gmailMessage.bodyText,
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
          data: {
            status: 'ERROR',
            error: error instanceof Error ? error.message : 'Auto-create failed'
          }
        });
      }
    }

    return NextResponse.json({
      message: canAutoCreate ? 'Gmail order processed and created in Cin7.' : 'Gmail order processed and created for review.',
      orderId: order.id,
      autoCreated: canAutoCreate,
      minimumConfidence
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Gmail process error';
    return NextResponse.json({ message }, { status: 500 });
  }
}
