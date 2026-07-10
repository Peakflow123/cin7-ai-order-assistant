import OpenAI from 'openai';
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

export async function extractOrderWithAI(text: string): Promise<ExtractedOrder> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY missing');

  const client = new OpenAI({ apiKey });
  const prompt = `Extract a B2B purchase order from this email. Return only valid JSON with keys: customerText, poNumber, lines. Each line must contain rawProductText, quantity, uom. If unknown, use null. Email:\n${text}`;

  const result = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0
  });

  const raw = result.choices[0]?.message?.content || '{}';
  const clean = raw.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(clean) as ExtractedOrder;

  return {
    customerText: parsed.customerText || null,
    poNumber: parsed.poNumber || null,
    lines: Array.isArray(parsed.lines) ? parsed.lines : []
  };
}

function scoreMatch(rawText: string, productName: string, sku?: string | null) {
  const raw = rawText.toLowerCase();
  const name = productName.toLowerCase();

  if (sku && raw.includes(sku.toLowerCase())) return 0.99;
  if (raw === name) return 0.98;

  const words = raw.split(/\W+/).filter(Boolean);
  const hits = words.filter((word) => name.includes(word)).length;
  return words.length ? hits / words.length : 0;
}

export async function matchProduct(companyId: string, rawText: string, customerId?: string | null) {
  const normalizedRawText = rawText.toLowerCase().trim();

  const alias = await prisma.productAlias.findFirst({
    where: { companyId, customerId: customerId || null, rawText: normalizedRawText }
  });

  if (alias) {
    const product = await prisma.product.findUnique({ where: { id: alias.productId } });
    if (product) return { product, confidence: 0.99 };
  }

  const products = await prisma.product.findMany({ where: { companyId }, take: 3000 });
  let bestProduct = null as (typeof products)[number] | null;
  let bestScore = 0;

  for (const product of products) {
    const score = scoreMatch(rawText, product.name, product.sku);
    if (score > bestScore) {
      bestProduct = product;
      bestScore = score;
    }
  }

  return { product: bestProduct, confidence: bestScore };
}
