import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { getOutlookMessageText } from '@/lib/outlook';
import { processEmailIntoOrder } from '@/lib/email-order';

export async function POST(request: Request) {
  try {
    const session = requireSession();
    const body = await request.json();
    const connectionId = body.connectionId;
    const messageId = body.messageId;
    const force = Boolean(body.force);
    if (!connectionId || !messageId) return new NextResponse('connectionId and messageId are required', { status: 400 });

    const outlookMessage = await getOutlookMessageText(connectionId, session.companyId, messageId);
    const sourceMessageId = `outlook:${connectionId}:${outlookMessage.conversationId || outlookMessage.messageId}`;

    const result = await processEmailIntoOrder({
      companyId: session.companyId,
      source: 'outlook',
      sourceConnectionId: connectionId,
      sourceAccount: outlookMessage.connection.email || null,
      sourceMessageId,
      sender: outlookMessage.from,
      subject: outlookMessage.subject,
      bodyText: outlookMessage.bodyText,
      force
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Unknown Outlook process error' }, { status: 500 });
  }
}
