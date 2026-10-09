import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { parseAttachmentBuffer } from '@/lib/attachment-text';
import { processEmailIntoOrder } from '@/lib/email-order';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left); const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function extractToken(recipient: string) {
  const local = recipient.toLowerCase().split('@')[0] || '';
  const match = local.match(/^orders-([a-f0-9]{24,64})$/i);
  return match?.[1] || null;
}
function extractOriginalSender(body: string, fallback: string) {
  const forwarded = body.match(/(?:^|\n)\s*From:\s*(.+?)(?:\r?\n|$)/i)?.[1]?.trim();
  return forwarded || fallback;
}
function cleanForwardedSubject(subject: string) {
  return subject.replace(/^\s*((fw|fwd)\s*:\s*)+/gi, '').trim() || '(No subject)';
}

export async function POST(request: Request) {
  try {
    const configuredSecret = process.env.INBOUND_EMAIL_SECRET || '';
    const suppliedSecret = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    if (!configuredSecret || !suppliedSecret || !safeEqual(configuredSecret, suppliedSecret)) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const payload = await request.json();
    const recipient = String(payload.to || '').trim().toLowerCase();
    const token = extractToken(recipient);
    if (!token) return NextResponse.json({ message: 'Invalid intake address.' }, { status: 400 });

    const companies = await prisma.$queryRawUnsafe<any[]>(`SELECT "id", "inboundEmailAllowedSenders" FROM "Company" WHERE "inboundEmailToken"=$1 AND COALESCE("inboundEmailEnabled",TRUE)=TRUE AND "isActive"=TRUE LIMIT 1`, token);
    const company = companies[0];
    if (!company) return NextResponse.json({ message: 'Intake address not found or disabled.' }, { status: 404 });

    const envelopeFrom = String(payload.from || '').trim().toLowerCase();
    const allowed = String(company.inboundEmailAllowedSenders || '').split(',').map((value) => value.trim().toLowerCase()).filter(Boolean);
    if (allowed.length && !allowed.includes(envelopeFrom)) return NextResponse.json({ message: 'Sender is not approved for this intake address.' }, { status: 403 });

    const recentCount = await prisma.order.count({ where: { companyId: company.id, source: 'inbound-email', createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } } });
    if (recentCount >= 100) return NextResponse.json({ message: 'Hourly inbound-order limit reached.' }, { status: 429 });

    const bodyText = String(payload.text || payload.htmlText || '').slice(0, 10000);
    const attachmentTexts: string[] = [];
    const attachments = Array.isArray(payload.attachments) ? payload.attachments.slice(0, 5) : [];
    for (const attachment of attachments) {
      const filename = String(attachment.filename || 'attachment');
      const mimeType = String(attachment.contentType || 'application/octet-stream');
      const buffer = Buffer.from(String(attachment.contentBase64 || ''), 'base64');
      if (!buffer.length || buffer.length > 18 * 1024 * 1024) continue;
      const text = await parseAttachmentBuffer(filename, mimeType, buffer);
      attachmentTexts.push(`Attachment: ${filename}\n${text}`);
    }

    const fullText = [bodyText, ...attachmentTexts].filter(Boolean).join('\n\n---\n\n').slice(0, 16000);
    const messageId = String(payload.messageId || crypto.createHash('sha256').update(`${recipient}|${envelopeFrom}|${payload.subject || ''}|${fullText}`).digest('hex'));
    const originalSender = extractOriginalSender(bodyText, envelopeFrom);
    const result = await processEmailIntoOrder({
      companyId: company.id,
      source: 'inbound-email',
      sourceAccount: recipient,
      sourceMessageId: `inbound:${messageId}`,
      internetMessageId: messageId,
      threadId: String(payload.inReplyTo || payload.references || '') || null,
      sender: originalSender,
      subject: cleanForwardedSubject(String(payload.subject || '(No subject)')),
      bodyText: fullText
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Inbound email processing failed.';
    await prisma.systemLog.create({ data: { level: 'ERROR', source: 'inbound-email', message } }).catch(() => null);
    return NextResponse.json({ message }, { status: 500 });
  }
}
