import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { processEmailIntoOrder } from '@/lib/email-order';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (mode !== 'subscribe' || !token || !challenge) return new NextResponse('Invalid verification request', { status: 400 });

  const connection = await prisma.whatsappConnection.findFirst({ where: { verifyToken: token, isActive: true } });
  if (!connection) return new NextResponse('Forbidden', { status: 403 });

  return new NextResponse(challenge, { status: 200 });
}

function extractMessageText(message: any) {
  if (message.type === 'text') return message.text?.body || '';
  if (message.type === 'button') return message.button?.text || '';
  if (message.type === 'interactive') return message.interactive?.button_reply?.title || message.interactive?.list_reply?.title || '';
  if (message.type === 'document') return `[WhatsApp document received: ${message.document?.filename || message.document?.id || 'document'}]. Document media download will be added in the next phase.`;
  if (message.type === 'image') return `[WhatsApp image received: ${message.image?.id || 'image'}]. Image OCR will be added in the next phase.`;
  return `[Unsupported WhatsApp message type: ${message.type || 'unknown'}]`;
}

export async function POST(request: Request) {
  const payload = await request.json();
  const results: any[] = [];

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      const phoneNumberId = value.metadata?.phone_number_id;
      if (!phoneNumberId || !Array.isArray(value.messages)) continue;

      const connection = await prisma.whatsappConnection.findFirst({ where: { phoneNumberId, isActive: true } });
      if (!connection) continue;

      for (const message of value.messages) {
        const contact = (value.contacts || []).find((item: any) => item.wa_id === message.from);
        const senderName = contact?.profile?.name || message.from || 'WhatsApp contact';
        const text = extractMessageText(message);
        const sourceMessageId = `whatsapp:${connection.id}:${message.id}`;

        const result = await processEmailIntoOrder({
          companyId: connection.companyId,
          source: 'whatsapp',
          sourceConnectionId: connection.id,
          sourceAccount: connection.displayPhoneNumber || connection.phoneNumberId,
          sourceMessageId,
          sender: senderName,
          subject: `WhatsApp message from ${senderName}`,
          bodyText: text
        });

        results.push(result);
      }
    }
  }

  return NextResponse.json({ ok: true, results });
}
