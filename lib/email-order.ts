import { prisma } from '@/lib/db';
import { extractOrderWithAI, matchCustomer, matchProduct, classifyEmailForOrder } from '@/lib/ai';
import { createCin7Sale } from '@/lib/cin7';

function extractEmailAddress(from: string) {
  const match = from.match(/<([^>]+)>/);
  return (match?.[1] || from || '').trim();
}

export async function processEmailIntoOrder(input: {
  companyId: string;
  source: string;
  sourceConnectionId?: string | null;
  sourceAccount?: string | null;
  sourceMessageId: string;
  sender: string;
  subject: string;
  bodyText: string;
  force?: boolean;
}) {
  const existingOrder = await prisma.order.findFirst({ where: { companyId: input.companyId, sourceMessageId: input.sourceMessageId } });
  if (existingOrder) return { orderId: existingOrder.id, alreadyProcessed: true, message: 'This message has already been processed.' };

  const classification = await classifyEmailForOrder({ companyId: input.companyId, subject: input.subject, from: input.sender, bodyText: input.bodyText });
  if (!input.force && classification.category === 'NOT_ORDER' && classification.confidence >= 0.7) {
    return { orderId: null, skipped: true, classification, message: 'Email is not related to a customer order.' };
  }

  const company = await prisma.company.findUnique({ where: { id: input.companyId } });
  if (!company) throw new Error('Company not found');

  const extracted = await extractOrderWithAI(input.bodyText);
  const senderEmail = extractEmailAddress(input.sender);
  const customerMatch = await matchCustomer(input.companyId, extracted.customerText, senderEmail);
  const customer = customerMatch.customer;

  const order = await prisma.order.create({
    data: {
      companyId: input.companyId,
      source: input.source,
      sourceConnectionId: input.sourceConnectionId || null,
      sourceAccount: input.sourceAccount || null,
      sourceMessageId: input.sourceMessageId,
      sender: senderEmail,
      subject: input.subject,
      originalText: input.bodyText,
      customerText: extracted.customerText || null,
      customerId: customer?.id || null,
      poNumber: extracted.poNumber || null,
      status: 'NEEDS_REVIEW'
    }
  });

  const confidences: number[] = [];
  for (const line of extracted.lines) {
    const match = await matchProduct(input.companyId, line.rawProductText, customer?.id || null);
    const confidence = match.confidence || 0;
    confidences.push(confidence);
    await prisma.orderLine.create({ data: { orderId: order.id, rawProductText: line.rawProductText, quantity: Number(line.quantity || 1), uom: line.uom || null, productId: confidence >= 0.7 ? match.product?.id || null : null, productName: confidence >= 0.7 ? match.product?.name || null : null, sku: confidence >= 0.7 ? match.product?.sku || null : null, confidence, status: confidence >= 0.85 ? 'MATCHED' : confidence >= 0.7 ? 'NEEDS_REVIEW' : 'UNMATCHED' } });
  }

  const minimumConfidence = Math.min(customerMatch.confidence || 0, ...(confidences.length ? confidences : [0]));
  const canAutoCreate = Boolean(company.autoCreateEnabled && customer && extracted.lines.length > 0 && minimumConfidence >= company.autoCreateThreshold);

  if (canAutoCreate) {
    try {
      await createCin7Sale(input.companyId, order.id);
    } catch (error) {
      await prisma.order.update({ where: { id: order.id }, data: { status: 'ERROR', error: error instanceof Error ? error.message : 'Auto-create failed' } });
    }
  }

  return { orderId: order.id, alreadyProcessed: false, autoCreated: canAutoCreate, minimumConfidence, classification, message: canAutoCreate ? 'Order auto-created in Cin7.' : 'Order created for review.' };
}
