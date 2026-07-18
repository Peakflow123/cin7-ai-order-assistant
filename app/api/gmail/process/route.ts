import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { makeSourceKeys, findExistingOrderForSource, choosePrimarySourceKey } from '@/lib/message-dedupe';
import { processEmailToOrder } from '@/lib/email-order';
import { getFullGmailMessage } from '@/lib/gmail';

export async function POST(request: Request) {
  const session = requireSession();
  const body = await request.json().catch(() => ({}));
  const messageId = String(body.messageId || '').trim();
  const connectionId = String(body.connectionId || '').trim();

  if (!messageId) return new NextResponse('messageId is required', { status: 400 });

  const connection = connectionId
    ? await prisma.gmailConnection.findFirst({ where: { id: connectionId, companyId: session.companyId } })
    : await prisma.gmailConnection.findFirst({ where: { companyId: session.companyId } });

  if (!connection) return new NextResponse('Gmail connection not found', { status: 404 });

  const message = await getFullGmailMessage(connection as any, messageId, { includeAttachmentText: true } as any);
  const keys = makeSourceKeys({ source: 'gmail', messageId: message.id, threadId: message.threadId, subject: message.subject, from: message.from });
  const existing = await findExistingOrderForSource(session.companyId, keys);
  if (existing) return NextResponse.json({ ok: true, duplicate: true, orderId: existing.id, message: 'This Gmail conversation/email was already processed.' });

  const result = await processEmailToOrder({
    companyId: session.companyId,
    source: 'gmail',
    sourceMessageId: choosePrimarySourceKey(keys),
    sourceConnectionId: connection.id,
    sourceAccount: connection.email,
    sender: message.from,
    subject: message.subject,
    originalText: message.fullText || message.body || message.snippet || ''
  } as any);

  return NextResponse.json({ ok: true, ...result });
}
