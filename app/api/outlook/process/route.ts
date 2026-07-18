import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { makeSourceKeys, findExistingOrderForSource, choosePrimarySourceKey } from '@/lib/message-dedupe';
import { processEmailToOrder } from '@/lib/email-order';
import { getFullOutlookMessage } from '@/lib/outlook';

export async function POST(request: Request) {
  const session = requireSession();
  const body = await request.json().catch(() => ({}));
  const messageId = String(body.messageId || '').trim();
  const connectionId = String(body.connectionId || '').trim();

  if (!messageId) return new NextResponse('messageId is required', { status: 400 });

  const connection = connectionId
    ? await prisma.outlookConnection.findFirst({ where: { id: connectionId, companyId: session.companyId } })
    : await prisma.outlookConnection.findFirst({ where: { companyId: session.companyId } });

  if (!connection) return new NextResponse('Outlook connection not found', { status: 404 });

  const message = await getFullOutlookMessage(connection as any, messageId, { includeAttachmentText: true } as any);
  const keys = makeSourceKeys({
    source: 'outlook',
    messageId: message.id,
    conversationId: message.conversationId,
    internetMessageId: message.internetMessageId,
    subject: message.subject,
    from: message.from
  });
  const existing = await findExistingOrderForSource(session.companyId, keys);
  if (existing) return NextResponse.json({ ok: true, duplicate: true, orderId: existing.id, message: 'This Outlook conversation/email was already processed.' });

  const result = await processEmailToOrder({
    companyId: session.companyId,
    source: 'outlook',
    sourceMessageId: choosePrimarySourceKey(keys),
    sourceConnectionId: connection.id,
    sourceAccount: connection.email,
    sender: message.from,
    subject: message.subject,
    originalText: message.fullText || message.body || message.snippet || ''
  } as any);

  return NextResponse.json({ ok: true, ...result });
}
