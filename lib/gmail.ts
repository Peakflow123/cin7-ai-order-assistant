import { google } from 'googleapis';
import { prisma } from '@/lib/db';
import { decrypt, encrypt } from '@/lib/crypto';

export type GmailMessageSummary = {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
  hasAttachments: boolean;
  attachmentNames: string[];
  alreadyProcessed: boolean;
  orderId: string | null;
};

function decodeBase64Url(value?: string | null) {
  if (!value) return '';
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(normalized, 'base64').toString('utf8');
}

function stripHtml(value: string) {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function getHeader(headers: any[] | undefined, name: string) {
  return headers?.find((header) => String(header.name || '').toLowerCase() === name.toLowerCase())?.value || '';
}

function collectTextParts(payload: any): { text: string; attachmentNames: string[] } {
  const attachmentNames: string[] = [];
  const plainParts: string[] = [];
  const htmlParts: string[] = [];

  function walk(part: any) {
    if (!part) return;

    const filename = String(part.filename || '').trim();
    if (filename) attachmentNames.push(filename);

    const mimeType = String(part.mimeType || '').toLowerCase();
    const bodyData = part.body?.data;

    if (bodyData && mimeType.includes('text/plain')) {
      plainParts.push(decodeBase64Url(bodyData));
    }

    if (bodyData && mimeType.includes('text/html')) {
      htmlParts.push(stripHtml(decodeBase64Url(bodyData)));
    }

    for (const child of part.parts || []) walk(child);
  }

  walk(payload);

  const text = plainParts.join('\n\n').trim() || htmlParts.join('\n\n').trim();
  return { text, attachmentNames };
}

export async function getGmailClient(connectionId: string, companyId: string) {
  const connection = await prisma.gmailConnection.findFirst({
    where: {
      id: connectionId,
      companyId,
      isActive: true
    }
  });

  if (!connection) throw new Error('Gmail connection not found or inactive.');

  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2.setCredentials({
    access_token: decrypt(connection.accessTokenEncrypted),
    refresh_token: decrypt(connection.refreshTokenEncrypted),
    expiry_date: connection.expiryDate ? Number(connection.expiryDate) : undefined
  });

  oauth2.on('tokens', async (tokens) => {
    const data: any = {};
    if (tokens.access_token) data.accessTokenEncrypted = encrypt(tokens.access_token);
    if (tokens.refresh_token) data.refreshTokenEncrypted = encrypt(tokens.refresh_token);
    if (tokens.expiry_date) data.expiryDate = BigInt(tokens.expiry_date);

    if (Object.keys(data).length > 0) {
      await prisma.gmailConnection.update({ where: { id: connection.id }, data });
    }
  });

  return {
    gmail: google.gmail({ version: 'v1', auth: oauth2 }),
    connection
  };
}

export async function getGmailMessageText(connectionId: string, companyId: string, messageId: string) {
  const { gmail, connection } = await getGmailClient(connectionId, companyId);

  const response = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full'
  });

  const message = response.data;
  const headers = message.payload?.headers || [];
  const from = getHeader(headers, 'From');
  const subject = getHeader(headers, 'Subject') || '(No subject)';
  const date = getHeader(headers, 'Date');
  const collected = collectTextParts(message.payload);

  const bodyText = collected.text || message.snippet || '';
  const attachmentNote = collected.attachmentNames.length
    ? `\n\nAttachment names found: ${collected.attachmentNames.join(', ')}`
    : '';

  return {
    connection,
    messageId: message.id || messageId,
    threadId: message.threadId || '',
    from,
    subject,
    date,
    bodyText: `${bodyText}${attachmentNote}`.trim(),
    attachmentNames: collected.attachmentNames
  };
}

export async function listRecentGmailMessages(connectionId: string, companyId: string, maxResults = 10) {
  const { gmail } = await getGmailClient(connectionId, companyId);

  const listResponse = await gmail.users.messages.list({
    userId: 'me',
    maxResults,
    q: 'newer_than:30d -in:spam -in:trash'
  });

  const messages = listResponse.data.messages || [];
  const summaries: GmailMessageSummary[] = [];

  for (const item of messages) {
    if (!item.id) continue;

    const response = await gmail.users.messages.get({
      userId: 'me',
      id: item.id,
      format: 'metadata',
      metadataHeaders: ['From', 'Subject', 'Date']
    });

    const message = response.data;
    const headers = message.payload?.headers || [];
    const sourceMessageId = `gmail:${connectionId}:${message.id}`;
    const existingOrder = await prisma.order.findFirst({
      where: {
        companyId,
        sourceMessageId
      },
      select: { id: true }
    });

    const attachmentNames: string[] = [];
    function walk(part: any) {
      if (!part) return;
      if (part.filename) attachmentNames.push(part.filename);
      for (const child of part.parts || []) walk(child);
    }
    walk(message.payload);

    summaries.push({
      id: message.id || item.id,
      threadId: message.threadId || item.threadId || '',
      from: getHeader(headers, 'From'),
      subject: getHeader(headers, 'Subject') || '(No subject)',
      date: getHeader(headers, 'Date'),
      snippet: message.snippet || '',
      hasAttachments: attachmentNames.length > 0,
      attachmentNames,
      alreadyProcessed: Boolean(existingOrder),
      orderId: existingOrder?.id || null
    });
  }

  return summaries;
}
