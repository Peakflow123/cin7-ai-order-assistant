import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { findExistingOrderForSource, makeSourceKeys } from '@/lib/message-dedupe';
import { getRecentOutlookMessages } from '@/lib/outlook';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = requireSession();
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get('limit') || 50), 100);
  const fromDate = searchParams.get('fromDate');
  const toDate = searchParams.get('toDate');
  const includeNotOrders = searchParams.get('includeNotOrders') === 'true';

  const outlookConnections = await prisma.outlookConnection.findMany({ where: { companyId: session.companyId } });
  const results: any[] = [];

  for (const connection of outlookConnections) {
    const messages = await getRecentOutlookMessages(connection as any, {
      limit,
      fromDate,
      toDate,
      includeAttachmentText: false,
      includeNotOrders
    } as any);

    for (const message of messages) {
      const keys = makeSourceKeys({
        source: 'outlook',
        messageId: message.id,
        conversationId: message.conversationId,
        internetMessageId: message.internetMessageId,
        subject: message.subject,
        from: message.from
      });
      const existing = await findExistingOrderForSource(session.companyId, keys);
      results.push({ ...message, sourceAccount: connection.email, alreadyProcessed: Boolean(existing), existingOrderId: existing?.id || null });
    }
  }

  return NextResponse.json({ messages: results });
}
