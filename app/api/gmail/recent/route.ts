import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { findExistingOrderForSource, makeSourceKeys } from '@/lib/message-dedupe';
import { getRecentGmailMessages } from '@/lib/gmail';

export const dynamic = 'force-dynamic';

function dateQuery(after?: string | null, before?: string | null) {
  const parts: string[] = [];
  if (after) parts.push(`after:${after.replaceAll('-', '/')}`);
  if (before) parts.push(`before:${before.replaceAll('-', '/')}`);
  return parts.join(' ');
}

export async function GET(request: Request) {
  const session = requireSession();
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get('limit') || 50), 100);
  const fromDate = searchParams.get('fromDate');
  const toDate = searchParams.get('toDate');
  const includeNotOrders = searchParams.get('includeNotOrders') === 'true';

  const gmailConnections = await prisma.gmailConnection.findMany({ where: { companyId: session.companyId } });
  const results: any[] = [];

  for (const connection of gmailConnections) {
    const messages = await getRecentGmailMessages(connection as any, {
      limit,
      query: dateQuery(fromDate, toDate),
      includeAttachmentText: false,
      includeNotOrders
    } as any);

    for (const message of messages) {
      const keys = makeSourceKeys({
        source: 'gmail',
        messageId: message.id,
        threadId: message.threadId,
        subject: message.subject,
        from: message.from
      });
      const existing = await findExistingOrderForSource(session.companyId, keys);
      results.push({ ...message, sourceAccount: connection.email, alreadyProcessed: Boolean(existing), existingOrderId: existing?.id || null });
    }
  }

  return NextResponse.json({ messages: results });
}
