import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { getGmailMessageText } from '@/lib/gmail';
import { processEmailIntoOrder } from '@/lib/email-order';

export async function POST(request: Request) {
  try {
    const session = requireSession();
    const body = await request.json();
    const connectionId = body.connectionId;
    const messageId = body.messageId;
    const force = Boolean(body.force);

    if (!connectionId || !messageId) return new NextResponse('connectionId and messageId are required', { status: 400 });

    const gmailMessage = await getGmailMessageText(connectionId, session.companyId, messageId);
    const sourceMessageId = `gmail:${connectionId}:${gmailMessage.threadId || gmailMessage.messageId}`;

    const result = await processEmailIntoOrder({
      companyId: session.companyId,
      source: 'gmail',
      sourceConnectionId: connectionId,
      sourceAccount: gmailMessage.connection.email || null,
      sourceMessageId,
      sender: gmailMessage.from,
      subject: gmailMessage.subject,
      bodyText: gmailMessage.bodyText,
      force
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Gmail process error';
    return NextResponse.json({ message }, { status: 500 });
  }
}
