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

function normalize(value: string | null | undefined) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
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

    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    }

    throw new Error(`AI returned invalid JSON: ${cleaned.slice(0, 500)}`);
  }
}

export async function extractOrderWithAI(text: string): Promise<ExtractedOrder> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY missing in Vercel environment variables');

  const prompt = `
You are an AI order extraction assistant for Cin7 Core.
Extract a B2B customer purchase order from the email text below.
Return ONLY valid JSON. Do not add explanation. Do not use markdown.

Required JSON format:
{
  "customerText": "customer name if found, otherwise null",
  "poNumber": "PO/reference number if found, otherwise null",
  "lines": [
    {
      "rawProductText": "product text exactly as customer wrote it",
      "quantity": 1,
      "uom": "unit of measure if found, otherwise null"
    }
  ]
}

Rules:
- Do not invent products.
- If quantity is missing, use 1.
- If no order lines are found, return an empty lines array.
- Keep rawProductText simple and clean.

Email text:
${text}
`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0
    })
  });

  const result = await response.json();
  if (!response.ok) throw new Error(`Groq API error: ${JSON.stringify(result)}`);

  const raw = result.choices?.[0]?.message?.content || '{}';
  const parsed = extractJsonFromText(raw) as ExtractedOrder;

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

export async function matchCustomer(companyId: string, customerText?: string | null, senderEmail?: string | null) {
  const raw = cleanAlias(customerText || senderEmail || '');

  if (raw) {
    const learned = await prisma.customerAlias.findUnique({
      where: {
        companyId_rawText: {
          companyId,
          rawText: raw
        }
      }
    });

    if (learned) {
      const customer = await prisma.customer.findFirst({
        where: {
          id: learned.customerId,
          companyId
        }
      });

      if (customer) return { customer, confidence: 0.99, reason: 'learned customer alias' };
    }
  }

  if (senderEmail) {
    const customerByEmail = await prisma.customer.findFirst({
      where: {
        companyId,
        email: {
          equals: senderEmail,
          mode: 'insensitive'
        }
      }
    });

    if (customerByEmail) return { customer: customerByEmail, confidence: 0.98, reason: 'customer email match' };
  }

  if (!customerText) return { customer: null, confidence: 0, reason: 'no customer text' };

  const customers = await prisma.customer.findMany({
    where: { companyId },
    take: 5000
  });

  let bestCustomer = null as (typeof customers)[number] | null;
  let bestScore = 0;

  for (const customer of customers) {
    const score = textScore(customerText, customer.name);

    if (score > bestScore) {
      bestCustomer = customer;
      bestScore = score;
    }
  }

  return {
    customer: bestScore >= 0.65 ? bestCustomer : null,
    confidence: bestScore,
    reason: 'name similarity'
  };
}

export async function matchProduct(companyId: string, rawText: string, customerId?: string | null) {
  const raw = cleanAlias(rawText);

  if (raw && customerId) {
    const customerAlias = await prisma.productAlias.findFirst({
      where: {
        companyId,
        customerId,
        rawText: raw
      }
    });

    if (customerAlias) {
      const product = await prisma.product.findFirst({
        where: {
          id: customerAlias.productId,
          companyId
        }
      });

      if (product) return { product, confidence: 0.99, reason: 'learned product alias' };
    }
  }

  if (raw) {
    const globalAlias = await prisma.productAlias.findFirst({
      where: {
        companyId,
        customerId: null,
        rawText: raw
      }
    });

    if (globalAlias) {
      const product = await prisma.product.findFirst({
        where: {
          id: globalAlias.productId,
          companyId
        }
      });

      if (product) return { product, confidence: 0.97, reason: 'global product alias' };
    }
  }

  const products = await prisma.product.findMany({
    where: { companyId },
    take: 5000
  });

  let bestProduct = null as (typeof products)[number] | null;
  let bestScore = 0;

  for (const product of products) {
    const skuScore = product.sku && cleanAlias(product.sku) === raw ? 0.99 : 0;
    const barcodeScore = product.barcode && cleanAlias(product.barcode) === raw ? 0.99 : 0;
    const nameScore = textScore(rawText, product.name);
    const score = Math.max(skuScore || 0, barcodeScore || 0, nameScore);

    if (score > bestScore) {
      bestProduct = product;
      bestScore = score;
    }
  }

  return {
    product: bestScore >= 0.62 ? bestProduct : null,
    confidence: bestScore,
    reason: 'sku/name/barcode similarity'
  };
}

export async function learnFromSuccessfulOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { lines: true }
  });

  if (!order) return;

  if (order.customerId && order.customerText) {
    const rawCustomer = cleanAlias(order.customerText);

    if (rawCustomer) {
      await prisma.customerAlias.upsert({
        where: {
          companyId_rawText: {
            companyId: order.companyId,
            rawText: rawCustomer
          }
        },
        update: {
          customerId: order.customerId,
          timesUsed: { increment: 1 },
          confidence: 1
        },
        create: {
          companyId: order.companyId,
          rawText: rawCustomer,
          customerId: order.customerId,
          confidence: 1
        }
      });
    }
  }

  // Prisma compound unique input does not accept null for customerId in this project version.
  // So self-learning stores customer-specific product aliases only after a customer is matched.
  if (!order.customerId) return;

  for (const line of order.lines) {
    if (!line.productId || line.confidence < 0.85) continue;

    const rawProduct = cleanAlias(line.rawProductText);
    if (!rawProduct) continue;

    await prisma.productAlias.upsert({
      where: {
        companyId_customerId_rawText: {
          companyId: order.companyId,
          customerId: order.customerId,
          rawText: rawProduct
        }
      },
      update: {
        productId: line.productId,
        timesUsed: { increment: 1 },
        confidence: line.confidence
      },
      create: {
        companyId: order.companyId,
        customerId: order.customerId,
        rawText: rawProduct,
        productId: line.productId,
        confidence: line.confidence
      }
    });
  }
}
