import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { listRecentGmailMessages, getGmailMessageText } from '@/lib/gmail';
import { processEmailIntoOrder } from '@/lib/email-order';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (!cronSecret) {
    return NextResponse.json({ message: 'CRON_SECRET is missing in Vercel environment variables.' }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const connections = await prisma.gmailConnection.findMany({
    where: {
      isActive: true,
      company: { isActive: true }
    },
    include: { company: true },
    take: 25
  });

  let found = 0;
  let processed = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const connection of connections) {
    try {
      const messages = await listRecentGmailMessages(connection.id, connection.companyId, 5, true);
      found += messages.length;

      for (const message of messages.slice(0, 3)) {
        if (message.alreadyProcessed) continue;

        if (message.classification.category !== 'ORDER' && message.classification.confidence >= 0.7) {
          skipped += 1;
          continue;
        }

        const full = await getGmailMessageText(connection.id, connection.companyId, message.id);

        const result = await processEmailIntoOrder({
          companyId: connection.companyId,
          source: 'gmail',
          sourceConnectionId: connection.id,
          sourceAccount: connection.email || null,
          sourceMessageId: `gmail:${connection.id}:${full.messageId}`,
          sender: full.from,
          subject: full.subject,
          bodyText: full.bodyText
        });

        if (result.orderId) processed += 1;
        if (result.skipped) skipped += 1;
      }

      await prisma.gmailConnection.update({
        where: { id: connection.id },
        data: { lastCheckedAt: new Date() }
      });
    } catch (error) {
      errors.push(`${connection.email || connection.id}: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }

  return NextResponse.json({
    ok: true,
    checkedAt: new Date().toISOString(),
    connections: connections.length,
    found,
    processed,
    skipped,
    errors
  });
}
