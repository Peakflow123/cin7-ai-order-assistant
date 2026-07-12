import { google } from 'googleapis';
import { prisma } from '@/lib/db';
import { decrypt, encrypt } from '@/lib/crypto';
import { classifyEmailForOrder, EmailOrderClassification } from '@/lib/ai';

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
  classification: EmailOrderClassification;
};

function decodeBase64Url(value?: string | null) {
  if (!value) return Buffer.from('');
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(normalized, 'base64');
}

function decodeBase64UrlText(value?: string | null) { return decodeBase64Url(value).toString('utf8'); }

function stripHtml(value: string) {
  return value.replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
}

function getHeader(headers: any[] | undefined, name: string) { return headers?.find((header) => String(header.name || '').toLowerCase() === name.toLowerCase())?.value || ''; }
function sanitizeText(value: string, max = 12000) { return value.replace(/\u0000/g, '').replace(/\s+\n/g, '\n').trim().slice(0, max); }

async function parseAttachmentBuffer(filename: string, mimeType: string, buffer: Buffer) {
  const lowerName = filename.toLowerCase();
  const lowerMime = mimeType.toLowerCase();
  try {
    if (lowerMime.includes('pdf') || lowerName.endsWith('.pdf')) {
      const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;
      const parsed = await pdfParse(buffer);
      return sanitizeText(parsed.text || '', 9000);
    }
    if (lowerName.endsWith('.docx') || lowerMime.includes('wordprocessingml')) {
      const mammoth = await import('mammoth');
      const parsed = await mammoth.extractRawText({ buffer });
      return sanitizeText(parsed.value || '', 9000);
    }
    if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls') || lowerMime.includes('spreadsheet')) {
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const parts: string[] = [];
      for (const sheetName of workbook.SheetNames.slice(0, 3)) {
        const sheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        parts.push(`Sheet: ${sheetName}\n${csv}`);
      }
      return sanitizeText(parts.join('\n\n'), 10000);
    }
    if (lowerName.endsWith('.txt') || lowerName.endsWith('.csv') || lowerMime.startsWith('text/')) return sanitizeText(buffer.toString('utf8'), 9000);
    if (lowerMime.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.webp'].some((ext) => lowerName.endsWith(ext))) return `[Image attachment found but OCR is not enabled yet: ${filename}]`;
  } catch (error) {
    return `[Could not parse attachment ${filename}: ${error instanceof Error ? error.message : 'unknown error'}]`;
  }
  return `[Unsupported attachment type: ${filename} (${mimeType || 'unknown mime type'})]`;
}

export async function getGmailClient(connectionId: string, companyId: string) {
  const connection = await prisma.gmailConnection.findFirst({ where: { id: connectionId, companyId, isActive: true } });
  if (!connection) throw new Error('Gmail connection not found or inactive.');
  const oauth2 = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
  oauth2.setCredentials({ access_token: decrypt(connection.accessTokenEncrypted), refresh_token: decrypt(connection.refreshTokenEncrypted), expiry_date: connection.expiryDate ? Number(connection.expiryDate) : undefined });
  oauth2.on('tokens', async (tokens) => {
    const data: any = {};
    if (tokens.access_token) data.accessTokenEncrypted = encrypt(tokens.access_token);
    if (tokens.refresh_token) data.refreshTokenEncrypted = encrypt(tokens.refresh_token);
    if (tokens.expiry_date) data.expiryDate = BigInt(tokens.expiry_date);
    if (Object.keys(data).length > 0) await prisma.gmailConnection.update({ where: { id: connection.id }, data });
  });
  return { gmail: google.gmail({ version: 'v1', auth: oauth2 }), connection };
}

function collectMetadataAttachmentNames(payload: any) {
  const attachmentNames: string[] = [];
  function walk(part: any) {
    if (!part) return;
    if (part.filename) attachmentNames.push(String(part.filename));
    for (const child of part.parts || []) walk(child);
  }
  walk(payload);
  return attachmentNames;
}

function collectFullParts(payload: any) {
  const plainParts: string[] = [];
  const htmlParts: string[] = [];
  const attachments: Array<{ filename: string; mimeType: string; attachmentId: string }> = [];
  function walk(part: any) {
    if (!part) return;
    const filename = String(part.filename || '').trim();
    const mimeType = String(part.mimeType || '').toLowerCase();
    const bodyData = part.body?.data;
    const attachmentId = part.body?.attachmentId;
    if (filename && attachmentId) attachments.push({ filename, mimeType, attachmentId });
    if (bodyData && mimeType.includes('text/plain')) plainParts.push(decodeBase64UrlText(bodyData));
    if (bodyData && mimeType.includes('text/html')) htmlParts.push(stripHtml(decodeBase64UrlText(bodyData)));
    for (const child of part.parts || []) walk(child);
  }
  walk(payload);
  const text = plainParts.join('\n\n').trim() || htmlParts.join('\n\n').trim();
  return { text, attachments };
}

export async function getGmailMessageText(connectionId: string, companyId: string, messageId: string) {
  const { gmail, connection } = await getGmailClient(connectionId, companyId);
  const response = await gmail.users.messages.get({ userId: 'me', id: messageId, format: 'full' });
  const message = response.data;
  const headers = message.payload?.headers || [];
  const from = getHeader(headers, 'From');
  const subject = getHeader(headers, 'Subject') || '(No subject)';
  const date = getHeader(headers, 'Date');
  const collected = collectFullParts(message.payload);
  const attachmentTexts: string[] = [];
  for (const attachment of collected.attachments.slice(0, 5)) {
    const attachmentResponse = await gmail.users.messages.attachments.get({ userId: 'me', messageId, id: attachment.attachmentId });
    const buffer = decodeBase64Url(attachmentResponse.data.data);
    const text = await parseAttachmentBuffer(attachment.filename, attachment.mimeType, buffer);
    attachmentTexts.push(`Attachment: ${attachment.filename}\n${text}`);
  }
  const bodyText = sanitizeText(collected.text || message.snippet || '', 9000);
  const fullText = [bodyText, ...attachmentTexts].filter(Boolean).join('\n\n---\n\n').slice(0, 16000);
  return { connection, messageId: message.id || messageId, threadId: message.threadId || '', from, subject, date, bodyText: fullText, attachmentNames: collected.attachments.map((item) => item.filename) };
}

export async function listRecentGmailMessages(connectionId: string, companyId: string, maxResults = 5, onlyOrderRelated = true) {
  const { gmail } = await getGmailClient(connectionId, companyId);
  const listResponse = await gmail.users.messages.list({ userId: 'me', maxResults, q: 'newer_than:14d -in:spam -in:trash' });
  const messages = listResponse.data.messages || [];
  const summaries: GmailMessageSummary[] = [];
  for (const item of messages) {
    if (!item.id) continue;
    const response = await gmail.users.messages.get({ userId: 'me', id: item.id, format: 'metadata', metadataHeaders: ['From', 'Subject', 'Date'] });
    const message = response.data;
    const headers = message.payload?.headers || [];
    const from = getHeader(headers, 'From');
    const subject = getHeader(headers, 'Subject') || '(No subject)';
    const date = getHeader(headers, 'Date');
    const attachmentNames = collectMetadataAttachmentNames(message.payload);
    const sourceMessageId = `gmail:${connectionId}:${message.id}`;
    const existingOrder = await prisma.order.findFirst({ where: { companyId, sourceMessageId }, select: { id: true } });
    const classification = await classifyEmailForOrder({ companyId, subject, from, snippet: message.snippet || '', attachmentNames });
    if (onlyOrderRelated && classification.category === 'NOT_ORDER' && classification.confidence >= 0.7) continue;
    summaries.push({ id: message.id || item.id, threadId: message.threadId || item.threadId || '', from, subject, date, snippet: message.snippet || '', hasAttachments: attachmentNames.length > 0, attachmentNames, alreadyProcessed: Boolean(existingOrder), orderId: existingOrder?.id || null, classification });
  }
  return summaries;
}
