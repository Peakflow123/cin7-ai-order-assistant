import { prisma } from '@/lib/db';
import { decrypt, encrypt } from '@/lib/crypto';
import { classifyEmailForOrder, EmailOrderClassification } from '@/lib/ai';
import { parseAttachmentBuffer } from '@/lib/attachment-text';

export type OutlookMessageSummary = {
  id: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
  hasAttachments: boolean;
  attachmentNames: string[];
  alreadyProcessed: boolean;
  orderId: string | null;
  classification: EmailOrderClassification;
};

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

function sanitizeText(value: string, max = 12000) {
  return value.replace(/\u0000/g, '').replace(/\s+\n/g, '\n').trim().slice(0, max);
}

async function graphFetch(accessToken: string, path: string, init?: RequestInit) {
  const response = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'outlook.body-content-type="text"',
      ...(init?.headers || {})
    }
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) throw new Error(`Microsoft Graph error: ${JSON.stringify(data).slice(0, 1000)}`);
  return data;
}

export async function getOutlookAccessToken(connectionId: string, companyId: string) {
  const connection = await prisma.outlookConnection.findFirst({ where: { id: connectionId, companyId, isActive: true } });
  if (!connection) throw new Error('Outlook connection not found or inactive.');

  const now = Date.now();
  if (connection.expiresAt && connection.expiresAt.getTime() > now + 120000) {
    return { accessToken: decrypt(connection.accessTokenEncrypted), connection };
  }

  const body = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID || '',
    client_secret: process.env.MICROSOFT_CLIENT_SECRET || '',
    refresh_token: decrypt(connection.refreshTokenEncrypted),
    grant_type: 'refresh_token',
    scope: 'offline_access User.Read Mail.Read'
  });

  const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  const tokens = await tokenResponse.json();
  if (!tokenResponse.ok) throw new Error(`Microsoft token refresh failed: ${JSON.stringify(tokens)}`);

  await prisma.outlookConnection.update({
    where: { id: connection.id },
    data: {
      accessTokenEncrypted: encrypt(tokens.access_token || ''),
      refreshTokenEncrypted: tokens.refresh_token ? encrypt(tokens.refresh_token) : connection.refreshTokenEncrypted,
      expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : connection.expiresAt
    }
  });

  return { accessToken: tokens.access_token as string, connection };
}

export async function getOutlookMessageText(connectionId: string, companyId: string, messageId: string) {
  const { accessToken, connection } = await getOutlookAccessToken(connectionId, companyId);

  const message = await graphFetch(accessToken, `/me/messages/${encodeURIComponent(messageId)}?$select=id,subject,from,receivedDateTime,body,bodyPreview,hasAttachments`);
  const from = message.from?.emailAddress?.address || message.from?.emailAddress?.name || '';
  const bodyText = message.body?.contentType === 'html' ? stripHtml(message.body?.content || '') : (message.body?.content || message.bodyPreview || '');
  const attachmentTexts: string[] = [];
  const attachmentNames: string[] = [];

  if (message.hasAttachments) {
    const attachments = await graphFetch(accessToken, `/me/messages/${encodeURIComponent(messageId)}/attachments`);
    for (const attachment of (attachments.value || []).slice(0, 5)) {
      const name = attachment.name || 'attachment';
      attachmentNames.push(name);
      if (attachment['@odata.type'] === '#microsoft.graph.fileAttachment' && attachment.contentBytes) {
        const buffer = Buffer.from(attachment.contentBytes, 'base64');
        const text = await parseAttachmentBuffer(name, attachment.contentType || '', buffer);
        attachmentTexts.push(`Attachment: ${name}\n${text}`);
      } else {
        attachmentTexts.push(`Attachment: ${name}\n[Unsupported Outlook attachment type]`);
      }
    }
  }

  const fullText = [sanitizeText(bodyText, 9000), ...attachmentTexts].filter(Boolean).join('\n\n---\n\n').slice(0, 16000);

  return {
    connection,
    messageId: message.id || messageId,
    from,
    subject: message.subject || '(No subject)',
    date: message.receivedDateTime || '',
    bodyText: fullText,
    attachmentNames
  };
}

export async function listRecentOutlookMessages(connectionId: string, companyId: string, maxResults = 5, onlyOrderRelated = true) {
  const { accessToken } = await getOutlookAccessToken(connectionId, companyId);
  const messages = await graphFetch(accessToken, `/me/messages?$top=${maxResults}&$orderby=receivedDateTime desc&$select=id,subject,from,receivedDateTime,bodyPreview,hasAttachments`);
  const summaries: OutlookMessageSummary[] = [];

  for (const message of messages.value || []) {
    const from = message.from?.emailAddress?.address || message.from?.emailAddress?.name || '';
    let attachmentNames: string[] = [];

    if (message.hasAttachments) {
      try {
        const attachments = await graphFetch(accessToken, `/me/messages/${encodeURIComponent(message.id)}/attachments`);
        attachmentNames = (attachments.value || []).slice(0, 5).map((item: any) => item.name || 'attachment');
      } catch {
        attachmentNames = ['Attachment detected'];
      }
    }

    const sourceMessageId = `outlook:${connectionId}:${message.id}`;
    const existingOrder = await prisma.order.findFirst({ where: { companyId, sourceMessageId }, select: { id: true } });
    const classification = await classifyEmailForOrder({ companyId, subject: message.subject || '', from, snippet: message.bodyPreview || '', attachmentNames });

    if (onlyOrderRelated && classification.category === 'NOT_ORDER' && classification.confidence >= 0.7) continue;

    summaries.push({
      id: message.id,
      from,
      subject: message.subject || '(No subject)',
      date: message.receivedDateTime || '',
      snippet: message.bodyPreview || '',
      hasAttachments: attachmentNames.length > 0,
      attachmentNames,
      alreadyProcessed: Boolean(existingOrder),
      orderId: existingOrder?.id || null,
      classification
    });
  }

  return summaries;
}
