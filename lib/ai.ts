import { prisma } from '@/lib/db';

export type ExtractedOrderLine = {
  rawProductText: string;
  quantity: number;
  uom?: string | null;
};

export type ExtractedOrder = {
  customerText?: string | null;
  poNumber?: string | null;
  lines: ExtractedOrderLine[];
};

export type EmailOrderClassification = {
  category: 'ORDER' | 'NOT_ORDER' | 'UNCLEAR';
  confidence: number;
  reason: string;
};

function normalize(value: string | null | undefined) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function cleanAlias(value: string | null | undefined) {
  return normalize(value).replace(/[^a-z0-9]+/g, ' ').trim();
}

function extractJsonFromText(text: string) {
  const cleaned = text.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    throw new Error(`AI returned invalid JSON: ${cleaned.slice(0, 500)}`);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGroqJson(prompt: string, options?: { model?: string; maxTokens?: number; retryOnRateLimit?: boolean }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY missing in Vercel environment variables');

  const model = options?.model || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  const maxTokens = options?.maxTokens || 1000;

  async function callOnce() {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        max_tokens: maxTokens
      })
    });
    const result = await response.json();
    return { response, result };
  }

  let { response, result } = await callOnce();
  if (!response.ok && options?.retryOnRateLimit !== false && result?.error?.code === 'rate_limit_exceeded') {
    await sleep(9000);
    const retry = await callOnce();
    response = retry.response;
    result = retry.result;
  }

  if (!response.ok) throw new Error(`Groq API error: ${JSON.stringify(result)}`);
  return extractJsonFromText(result.choices?.[0]?.message?.content || '{}');
}

async function getClientFalsePositiveExamples(companyId?: string) {
  if (!companyId) return '';

  const feedback = await prisma.orderFeedback.findMany({
    where: { companyId, feedbackType: 'NOT_ORDER' },
    orderBy: { createdAt: 'desc' },
    take: 8
  });

  if (feedback.length === 0) return '';

  return feedback.map((item, index) => {
    const subject = item.subject || 'No subject';
    const comment = item.comment || 'No comment';
    const preview = (item.originalText || '').replace(/\s+/g, ' ').slice(0, 350);
    return `${index + 1}. Subject: ${subject}\nUser comment: ${comment}\nEmail preview: ${preview}`;
  }).join('\n\n');
}

export async function classifyEmailForOrder(input: {
  companyId?: string;
  subject?: string | null;
  from?: string | null;
  snippet?: string | null;
  attachmentNames?: string[];
  bodyText?: string;
}): Promise<EmailOrderClassification> {
  const attachmentNames = input.attachmentNames?.length ? input.attachmentNames.join(', ') : 'None';
  const falsePositiveExamples = await getClientFalsePositiveExamples(input.companyId);

  const prompt = `
Classify this B2B email for an order processing system.
Return ONLY valid JSON. No markdown.

Categories:
- ORDER: customer is placing or confirming a purchase/sales order, or attachment name likely contains a PO/order.
- NOT_ORDER: newsletter, invoice only, payment reminder, shipping notice, marketing, support discussion, spam, quote request with no confirmed purchase, vendor purchase order not from a customer, or unrelated email.
- UNCLEAR: not enough information but could be an order.

Only use feedback examples from this same client/company. Previous NOT_ORDER feedback for this client:
${falsePositiveExamples || 'No feedback examples yet.'}

Required JSON:
{
  "category": "ORDER | NOT_ORDER | UNCLEAR",
  "confidence": 0.0,
  "reason": "short reason"
}

Subject: ${input.subject || ''}
From: ${input.from || ''}
Snippet/body preview: ${(input.snippet || input.bodyText || '').slice(0, 1800)}
Attachment names: ${attachmentNames}
`;

  const parsed = await callGroqJson(prompt, {
    model: process.env.GROQ_CLASSIFIER_MODEL || 'llama-3.1-8b-instant',
    maxTokens: 220
  });

  const category = ['ORDER', 'NOT_ORDER', 'UNCLEAR'].includes(parsed.category) ? parsed.category : 'UNCLEAR';
  const confidence = Number(parsed.confidence || 0);
  return {
    category,
    confidence: Number.isFinite(confidence) ? confidence : 0,
    reason: parsed.reason || 'No reason provided'
  };
}

export async function extractOrderWithAI(text: string): Promise<ExtractedOrder> {
  const compactText = text.replace(/\s+/g, ' ').replace(/Attachment: /g, '\nAttachment: ').slice(0, 14000);

  const prompt = `
You are an AI order extraction assistant for Cin7 Core.
Extract a B2B customer purchase order from the email text and attachment text below.
Return ONLY valid JSON. Do not add explanation. Do not use markdown.

Required JSON format:
{
  "customerText": "customer name if found, otherwise null",
  "poNumber": "PO/reference number if found, otherwise null",
  "lines": [
    { "rawProductText": "product text including unit/pack/box/carton/size exactly as customer intended", "quantity": 1, "uom": "unit wording if found, otherwise null" }
  ]
}

Rules:
- Use attachment text if email body only says see attached PO.
- Keep packaging/variant wording, such as box, case, carton, pack, unit, set, size, color.
- Do not invent products.
- If quantity is missing, use 1.
- If no order lines are found, return an empty lines array.

Text:
${compactText}
`;

  const parsed = await callGroqJson(prompt, {
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    maxTokens: 1600
  }) as ExtractedOrder;

  return {
    customerText: parsed.customerText || null,
    poNumber: parsed.poNumber || null,
    lines: Array.isArray(parsed.lines) ? parsed.lines : []
  };
}

function textScore(a: string, b: string) {
  const left = cleanAlias(a);
  const right = cleanAlias(b);
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.includes(right) || right.includes(left)) return 0.9;
  const words = left.split(' ').filter(Boolean);
  const hits = words.filter((word) => right.includes(word)).length;
  return words.length ? hits / words.length : 0;
}

function packagingWords(value: string) {
  const words = cleanAlias(value).split(' ');
  return words.filter((word) => ['box', 'boxes', 'carton', 'cartons', 'case', 'cases', 'pack', 'packs', 'packet', 'set', 'unit', 'each', 'single', 'bottle', 'roll', 'kg', 'g', 'ml', 'l', 'litre', 'liter', 'pcs', 'piece', 'pieces'].includes(word));
}

function packagingBonus(rawText: string, productText: string) {
  const rawPackaging = packagingWords(rawText);
  if (rawPackaging.length === 0) return 0;
  const product = cleanAlias(productText);
  const matched = rawPackaging.filter((word) => product.includes(word)).length;
  return matched / rawPackaging.length * 0.12;
}

export async function matchCustomer(companyId: string, customerText?: string | null, senderEmail?: string | null) {
  const raw = cleanAlias(customerText || senderEmail || '');

  if (raw) {
    const learned = await prisma.customerAlias.findUnique({ where: { companyId_rawText: { companyId, rawText: raw } } });
    if (learned) {
      const customer = await prisma.customer.findFirst({ where: { id: learned.customerId, companyId } });
      if (customer) return { customer, confidence: 0.99, reason: 'learned customer alias' };
    }
  }

  if (senderEmail) {
    const customerByEmail = await prisma.customer.findFirst({ where: { companyId, email: { equals: senderEmail, mode: 'insensitive' } } });
    if (customerByEmail) return { customer: customerByEmail, confidence: 0.98, reason: 'customer email match' };
  }

  if (!customerText) return { customer: null, confidence: 0, reason: 'no customer text' };

  const customers = await prisma.customer.findMany({ where: { companyId }, take: 5000 });
  let bestCustomer = null as (typeof customers)[number] | null;
  let bestScore = 0;

  for (const customer of customers) {
    const score = textScore(customerText, customer.name);
    if (score > bestScore) {
      bestCustomer = customer;
      bestScore = score;
    }
  }

  return { customer: bestScore >= 0.65 ? bestCustomer : null, confidence: bestScore, reason: 'name similarity' };
}

export async function matchProduct(companyId: string, rawText: string, customerId?: string | null) {
  const raw = cleanAlias(rawText);

  if (raw && customerId) {
    const customerAlias = await prisma.productAlias.findFirst({ where: { companyId, customerId, rawText: raw } });
    if (customerAlias) {
      const product = await prisma.product.findFirst({ where: { id: customerAlias.productId, companyId } });
      if (product) return { product, confidence: 0.99, reason: 'learned product alias' };
    }
  }

  const products = await prisma.product.findMany({ where: { companyId }, take: 5000 });
  let bestProduct = null as (typeof products)[number] | null;
  let bestScore = 0;

  for (const product of products) {
    const combined = `${product.sku || ''} ${product.name}`;
    const skuScore = product.sku && cleanAlias(product.sku) === raw ? 0.99 : 0;
    const barcodeScore = product.barcode && cleanAlias(product.barcode) === raw ? 0.99 : 0;
    const nameScore = Math.min(1, textScore(rawText, combined) + packagingBonus(rawText, combined));
    const score = Math.max(skuScore || 0, barcodeScore || 0, nameScore);
    if (score > bestScore) {
      bestProduct = product;
      bestScore = score;
    }
  }

  return { product: bestScore >= 0.62 ? bestProduct : null, confidence: bestScore, reason: 'sku/name/barcode/packaging similarity' };
}

export async function learnFromSuccessfulOrder(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { lines: true } });
  if (!order) return;

  if (order.customerId && order.customerText) {
    const rawCustomer = cleanAlias(order.customerText);
    if (rawCustomer) {
      await prisma.customerAlias.upsert({
        where: { companyId_rawText: { companyId: order.companyId, rawText: rawCustomer } },
        update: { customerId: order.customerId, timesUsed: { increment: 1 }, confidence: 1 },
        create: { companyId: order.companyId, rawText: rawCustomer, customerId: order.customerId, confidence: 1 }
      });
    }
  }

  if (!order.customerId) return;

  for (const line of order.lines) {
    if (!line.productId || line.confidence < 0.85) continue;
    const rawProduct = cleanAlias(line.rawProductText);
    if (!rawProduct) continue;
    await prisma.productAlias.upsert({
      where: { companyId_customerId_rawText: { companyId: order.companyId, customerId: order.customerId, rawText: rawProduct } },
      update: { productId: line.productId, timesUsed: { increment: 1 }, confidence: line.confidence },
      create: { companyId: order.companyId, customerId: order.customerId, rawText: rawProduct, productId: line.productId, confidence: line.confidence }
    });
  }
}
