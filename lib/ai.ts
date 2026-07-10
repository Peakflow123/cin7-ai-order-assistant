import OpenAI from 'openai';
import { prisma } from '@/lib/db';

export async function extractOrderWithAI(text: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY missing');
  const client = new OpenAI({ apiKey });
  const prompt = `Extract a B2B purchase order from this email. Return only valid JSON with keys: customerText, poNumber, lines. lines must contain rawProductText, quantity, uom. If unknown, use null. Email:\n${text}`;
  const res = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0
  });
  const raw = res.choices[0]?.message?.content || '{}';
  const clean = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

function scoreMatch(raw: string, productName: string, sku?: string | null) {
  const a = raw.toLowerCase();
  const b = productName.toLowerCase();
  if (sku && a.includes(sku.toLowerCase())) return 0.99;
  if (a === b) return 0.98;
  const words = a.split(/\W+/).filter(Boolean);
  const hits = words.filter(w => b.includes(w)).length;
  return words.length ? hits / words.length : 0;
}

export async function matchProduct(companyId: string, rawText: string, customerId?: string | null) {
  const alias = await prisma.productAlias.findFirst({ where: { companyId, customerId: customerId || null, rawText: rawText.toLowerCase() } });
  if (alias) {
    const p = await prisma.product.findUnique({ where: { id: alias.productId } });
    if (p) return { product: p, confidence: 0.99 };
  }
  const products = await prisma.product.findMany({ where: { companyId }, take: 2000 });
  let best: any = null;
  let bestScore = 0;
  for (const p of products) {
    const s = scoreMatch(rawText, p.name, p.sku);
    if (s > bestScore) { best = p; bestScore = s; }
  }
  return { product: best, confidence: bestScore };
}
