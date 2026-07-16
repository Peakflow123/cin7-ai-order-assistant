import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { listRecentGmailMessages, getGmailMessageText } from '@/lib/gmail';
import { listRecentOutlookMessages, getOutlookMessageText } from '@/lib/outlook';
import { processEmailIntoOrder } from '@/lib/email-order';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  if (!cronSecret) return NextResponse.json({ message: 'CRON_SECRET is missing in Vercel environment variables.' }, { status: 500 });
  if (authHeader !== `Bearer ${cronSecret}`) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  let found = 0;
  let processed = 0;
  let skipped = 0;
  const errors: string[] = [];

  const gmailConnections = await prisma.gmailConnection.findMany({ where: { isActive: true, company: { isActive: true } }, include: { company: true }, take: 25 });
  for (const connection of gmailConnections) {
    try {
      const messages = await listRecentGmailMessages(connection.id, connection.companyId, 5, true);
      found += messages.length;
      for (const message of messages.slice(0, 3)) {
        if (message.alreadyProcessed) continue;
        if (message.classification.category !== 'ORDER' && message.classification.confidence >= 0.7) { skipped += 1; continue; }
        const full = await getGmailMessageText(connection.id, connection.companyId, message.id);
        const result = await processEmailIntoOrder({ companyId: connection.companyId, source: 'gmail', sourceConnectionId: connection.id, sourceAccount: connection.email || null, sourceMessageId: `gmail:${connection.id}:${full.messageId}`, sender: full.from, subject: full.subject, bodyText: full.bodyText });
        if (result.orderId) processed += 1;
        if (result.skipped) skipped += 1;
      }
      await prisma.gmailConnection.update({ where: { id: connection.id }, data: { lastCheckedAt: new Date() } });
    } catch (error) {
      errors.push(`Gmail ${connection.email || connection.id}: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }

  const outlookConnections = await prisma.outlookConnection.findMany({ where: { isActive: true, company: { isActive: true } }, include: { company: true }, take: 25 });
  for (const connection of outlookConnections) {
    try {
      const messages = await listRecentOutlookMessages(connection.id, connection.companyId, 5, true);
      found += messages.length;
      for (const message of messages.slice(0, 3)) {
        if (message.alreadyProcessed) continue;
        if (message.classification.category !== 'ORDER' && message.classification.confidence >= 0.7) { skipped += 1; continue; }
        const full = await getOutlookMessageText(connection.id, connection.companyId, message.id);
        const result = await processEmailIntoOrder({ companyId: connection.companyId, source: 'outlook', sourceConnectionId: connection.id, sourceAccount: connection.email || null, sourceMessageId: `outlook:${connection.id}:${full.messageId}`, sender: full.from, subject: full.subject, bodyText: full.bodyText });
        if (result.orderId) processed += 1;
        if (result.skipped) skipped += 1;
      }
      await prisma.outlookConnection.update({ where: { id: connection.id }, data: { lastCheckedAt: new Date() } });
    } catch (error) {
      errors.push(`Outlook ${connection.email || connection.id}: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }

  return NextResponse.json({ ok: true, checkedAt: new Date().toISOString(), gmailConnections: gmailConnections.length, outlookConnections: outlookConnections.length, found, processed, skipped, errors });
}
