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
  // 1) Exact same message already processed (same mailbox).
  const existingOrder = await prisma.order.findFirst({ where: { companyId: input.companyId, sourceMessageId: input.sourceMessageId } });
  if (existingOrder) return { orderId: existingOrder.id, alreadyProcessed: true, message: 'This message has already been processed.' };

  // 2) Same email received in ANY mailbox of this company (cross-mailbox exact duplicate).
  const internetMessageId = input.internetMessageId ? String(input.internetMessageId).trim() : null;
  if (internetMessageId) {
    const sameEmail = await prisma.order.findFirst({ where: { companyId: input.companyId, internetMessageId } });
    if (sameEmail) {
      return { orderId: sameEmail.id, alreadyProcessed: true, duplicate: true, message: 'This exact email was already captured (it was received in another connected mailbox too).' };
    }
  }

  // 3) Classify the email (junk filtering happens here).
  const classification = await classifyEmailForOrder({ companyId: input.companyId, subject: input.subject, from: input.sender, bodyText: input.bodyText });
  if (!input.force && classification.category === 'NOT_ORDER' && classification.confidence >= 0.7) {
    return { orderId: null, skipped: true, classification, message: 'Email is not a customer order.' };
  }

  const company = await prisma.company.findUnique({ where: { id: input.companyId } });
  if (!company) throw new Error('Company not found');

  // 4) Extract order content.
  const extracted = await extractOrderWithAI(input.bodyText);
  const threadId = input.threadId ? String(input.threadId).trim() : null;
  const normalizedPo = normalizePo(extracted.poNumber);
  const contentHash = computeContentHash(extracted.customerText, extracted.lines);

  // 5) Thread-based reply handling (rule B: allow a new order only if new PO or new line items).
  if (threadId) {
    const threadOrders = await prisma.order.findMany({
      where: { companyId: input.companyId, threadId },
      select: { id: true, normalizedPo: true, contentHash: true }
    });

    if (threadOrders.length > 0) {
      // A reply with no extractable order lines is just conversation (thanks/confirmed/etc.).
      if (!input.force && extracted.lines.length === 0) {
        return { orderId: threadOrders[0].id, alreadyProcessed: true, duplicate: true, message: 'This looks like a reply in an existing order thread with no new order details.' };
      }

      const hasNewPo = Boolean(normalizedPo) && !threadOrders.some((o) => o.normalizedPo && o.normalizedPo === normalizedPo);
      const hasNewContent = Boolean(contentHash) && !threadOrders.some((o) => o.contentHash && o.contentHash === contentHash);

      // Same PO or identical items already captured in this thread -> pure duplicate reply.
      if (!input.force && !hasNewPo && !hasNewContent) {
        return { orderId: threadOrders[0].id, alreadyProcessed: true, duplicate: true, message: 'This reply matches an order already captured in this thread.' };
      }
      // Otherwise it has a new PO or new items -> allowed to create a new order (rule B).
    }
  }

  // 6) Possible-duplicate detection (still create, but flag for human review; never auto-create).
  let possibleDuplicate = false;
  let duplicateReason: string | null = null;

  // 6a) Same PO number elsewhere in the company.
  if (normalizedPo) {
    const samePo = await prisma.order.findFirst({ where: { companyId: input.companyId, normalizedPo } });
    if (samePo) {
      possibleDuplicate = true;
      duplicateReason = 'Same PO number as an existing order.';
    }
  }

  // 6b) Same customer + same items within 72 hours (cross-mailbox separate emails).
  if (!possibleDuplicate && contentHash) {
    const since = new Date(Date.now() - 72 * 60 * 60 * 1000);
    const sameContent = await prisma.order.findFirst({ where: { companyId: input.companyId, contentHash, createdAt: { gte: since } } });
    if (sameContent) {
      possibleDuplicate = true;
      duplicateReason = 'Same customer and items as a recent order (possible duplicate across mailboxes).';
    }
  }

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
      internetMessageId,
      threadId,
      normalizedPo,
      contentHash,
      possibleDuplicate,
      duplicateReason,
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

  // 7) Auto-create policy: respects admin threshold, requires lines, blocks on possible-duplicate.
  const minimumConfidence = Math.min(customerMatch.confidence || 0, ...(confidences.length ? confidences : [0]));
  const canAutoCreate = Boolean(
    company.autoCreateEnabled &&
    customer &&
    extracted.lines.length > 0 &&
    !possibleDuplicate &&
    minimumConfidence >= company.autoCreateThreshold
  );

  if (canAutoCreate) {
    try {
      await createCin7Sale(input.companyId, order.id);
    } catch (error) {
      await prisma.order.update({ where: { id: order.id }, data: { status: 'ERROR', error: error instanceof Error ? error.message : 'Auto-create failed' } });
    }
  }

  return {
    orderId: order.id,
    alreadyProcessed: false,
    autoCreated: canAutoCreate,
    possibleDuplicate,
    duplicateReason,
    minimumConfidence,
    classification,
    message: possibleDuplicate
      ? 'Order created but flagged as a possible duplicate for review.'
      : canAutoCreate
        ? 'Order auto-created in Cin7.'
        : 'Order created for review.'
  };
}
