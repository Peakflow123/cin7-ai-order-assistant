import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { extractOrderWithAI, matchCustomer, matchProduct, classifyEmailForOrder } from '@/lib/ai';
import { createCin7Sale } from '@/lib/cin7';

function extractEmailAddress(from: string) {
  const match = from.match(/<([^>]+)>/);
  return (match?.[1] || from || '').trim();
}

function normalizePo(po?: string | null) {
  const cleaned = String(po || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return cleaned.length >= 3 ? cleaned : null;
}

function normalizeSubject(subject?: string | null) {
  return String(subject || '')
    .replace(/^\s*((re|fw|fwd)\s*:\s*)+/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function isReplyOrForward(subject?: string | null) {
  return /^\s*(re|fw|fwd)\s*:/i.test(String(subject || ''));
}

function lineSignature(lines: { rawProductText: string; quantity: number }[]) {
  if (!lines.length) return null;
  return lines
    .map((line) => `${Number(line.quantity || 1)}x${String(line.rawProductText || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ')}`)
    .sort()
    .join('|');
}

function computeContentHash(customerText: string | null | undefined, lines: { rawProductText: string; quantity: number }[]) {
  const cust = String(customerText || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const normalizedLines = lines
    .map((l) => `${Number(l.quantity || 1)}x${String(l.rawProductText || '').trim().toLowerCase().replace(/\s+/g, ' ')}`)
    .sort();
  if (normalizedLines.length === 0) return null;
  const basis = `${cust}||${normalizedLines.join('|')}`;
  return crypto.createHash('sha256').update(basis).digest('hex');
}

export async function processEmailIntoOrder(input: {
  companyId: string;
  source: string;
  sourceConnectionId?: string | null;
  sourceAccount?: string | null;
  sourceMessageId: string;
  internetMessageId?: string | null;
  threadId?: string | null;
  sender: string;
  subject: string;
  bodyText: string;
  force?: boolean;
}) {
  const existingOrder = await prisma.order.findFirst({ where: { companyId: input.companyId, sourceMessageId: input.sourceMessageId } });
  if (existingOrder) return { orderId: existingOrder.id, alreadyProcessed: true, message: 'This message has already been processed.' };

  const internetMessageId = input.internetMessageId ? String(input.internetMessageId).trim() : null;
  if (internetMessageId) {
    const sameEmail = await prisma.order.findFirst({ where: { companyId: input.companyId, internetMessageId } });
    if (sameEmail) return { orderId: sameEmail.id, alreadyProcessed: true, duplicate: true, message: 'This exact email was already captured in another connected mailbox.' };
  }

  const classification = await classifyEmailForOrder({ companyId: input.companyId, subject: input.subject, from: input.sender, bodyText: input.bodyText });
  if (!input.force && classification.category === 'NOT_ORDER' && classification.confidence >= 0.7) {
    return { orderId: null, skipped: true, classification, message: 'Email is not a customer order.' };
  }

  const company = await prisma.company.findUnique({ where: { id: input.companyId } });
  if (!company) throw new Error('Company not found');

  const extracted = await extractOrderWithAI(input.bodyText);
  const threadId = input.threadId ? String(input.threadId).trim() : null;
  const normalizedPo = normalizePo(extracted.poNumber);
  const contentHash = computeContentHash(extracted.customerText, extracted.lines);

  if (threadId) {
    const threadOrders = await prisma.order.findMany({
      where: { companyId: input.companyId, threadId },
      select: { id: true, normalizedPo: true, contentHash: true },
      orderBy: { createdAt: 'asc' }
    });

    if (threadOrders.length > 0) {
      if (!input.force && extracted.lines.length === 0) {
        return { orderId: threadOrders[0].id, alreadyProcessed: true, duplicate: true, message: 'Reply ignored because the existing order thread contains no new order details.' };
      }

      const hasNewPo = Boolean(normalizedPo) && !threadOrders.some((order) => order.normalizedPo === normalizedPo);
      const hasNewContent = Boolean(contentHash) && !threadOrders.some((order) => order.contentHash === contentHash);

      if (!input.force && !hasNewPo && !hasNewContent) {
        return { orderId: threadOrders[0].id, alreadyProcessed: true, duplicate: true, message: 'Reply or forward ignored because this order was already captured in the same email thread.' };
      }
    }
  }

  // Legacy-safe fallback: older automatically created orders may not have a thread ID.
  // Only applies to subjects that are explicitly replies/forwards and compares the original subject plus PO/line items.
  if (!input.force && isReplyOrForward(input.subject)) {
    const normalizedCurrentSubject = normalizeSubject(input.subject);
    const currentLineSignature = lineSignature(extracted.lines);
    const recentOrders = await prisma.order.findMany({
      where: { companyId: input.companyId },
      select: {
        id: true,
        subject: true,
        normalizedPo: true,
        lines: { select: { rawProductText: true, quantity: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    const replySourceOrder = recentOrders.find((order) => {
      if (normalizeSubject(order.subject) !== normalizedCurrentSubject) return false;
      const samePo = Boolean(normalizedPo) && order.normalizedPo === normalizedPo;
      const sameLines = Boolean(currentLineSignature) && lineSignature(order.lines) === currentLineSignature;
      const noNewOrderLines = extracted.lines.length === 0;
      return samePo || sameLines || noNewOrderLines;
    });

    if (replySourceOrder) {
      return {
        orderId: replySourceOrder.id,
        alreadyProcessed: true,
        duplicate: true,
        message: 'Reply or forward ignored because the original order was already captured.'
      };
    }
  }

  if (!input.force && normalizedPo) {
    const samePo = await prisma.order.findFirst({ where: { companyId: input.companyId, normalizedPo }, select: { id: true } });
    if (samePo) return { orderId: samePo.id, alreadyProcessed: true, duplicate: true, message: 'Reply or forward ignored because this PO number already exists.' };
  }

  if (!input.force && contentHash) {
    const since = new Date(Date.now() - 72 * 60 * 60 * 1000);
    const sameContent = await prisma.order.findFirst({ where: { companyId: input.companyId, contentHash, createdAt: { gte: since } }, select: { id: true } });
    if (sameContent) return { orderId: sameContent.id, alreadyProcessed: true, duplicate: true, message: 'Reply or forward ignored because the same customer and order lines were captured recently.' };
  }

  const senderEmail = extractEmailAddress(input.sender);
  const customerMatch = await matchCustomer(input.companyId, extracted.customerText, senderEmail);
  const customer = customerMatch.customer;

  const order = await prisma.order.create({
    data: {
      companyId: input.companyId, source: input.source, sourceConnectionId: input.sourceConnectionId || null,
      sourceAccount: input.sourceAccount || null, sourceMessageId: input.sourceMessageId, internetMessageId,
      threadId, normalizedPo, contentHash, possibleDuplicate: false, duplicateReason: null,
      sender: senderEmail, subject: input.subject, originalText: input.bodyText,
      customerText: extracted.customerText || null, customerId: customer?.id || null,
      poNumber: extracted.poNumber || null, status: 'NEEDS_REVIEW'
    }
  });

  const confidences: number[] = [];
  for (const line of extracted.lines) {
    const match = await matchProduct(input.companyId, line.rawProductText, customer?.id || null);
    const confidence = match.confidence || 0;
    confidences.push(confidence);
    await prisma.orderLine.create({ data: {
      orderId: order.id, rawProductText: line.rawProductText, quantity: Number(line.quantity || 1), uom: line.uom || null,
      productId: confidence >= 0.7 ? match.product?.id || null : null,
      productName: confidence >= 0.7 ? match.product?.name || null : null,
      sku: confidence >= 0.7 ? match.product?.sku || null : null,
      confidence, status: confidence >= 0.85 ? 'MATCHED' : confidence >= 0.7 ? 'NEEDS_REVIEW' : 'UNMATCHED'
    }});
  }

  const minimumConfidence = Math.min(customerMatch.confidence || 0, ...(confidences.length ? confidences : [0]));
  const canAutoCreate = Boolean(company.autoCreateEnabled && customer && extracted.lines.length > 0 && minimumConfidence >= company.autoCreateThreshold);

  if (canAutoCreate) {
    try { await createCin7Sale(input.companyId, order.id); }
    catch (error) { await prisma.order.update({ where: { id: order.id }, data: { status: 'ERROR', error: error instanceof Error ? error.message : 'Auto-create failed' } }); }
  }

  return { orderId: order.id, alreadyProcessed: false, autoCreated: canAutoCreate, possibleDuplicate: false,
    duplicateReason: null, minimumConfidence, classification,
    message: canAutoCreate ? 'Order auto-created in Cin7.' : 'Order created for review.' };
}
