import { prisma } from '@/lib/db';

export type EmailSource = 'gmail' | 'outlook';

export function cleanSubject(subject?: string | null) {
  return String(subject || '')
    .replace(/^(re|fw|fwd):\s*/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function makeSourceKeys(args: {
  source: EmailSource;
  messageId: string;
  threadId?: string | null;
  conversationId?: string | null;
  internetMessageId?: string | null;
  subject?: string | null;
  from?: string | null;
}) {
  const keys = new Set<string>();
  if (args.messageId) keys.add(`${args.source}:message:${args.messageId}`);
  if (args.threadId) keys.add(`${args.source}:thread:${args.threadId}`);
  if (args.conversationId) keys.add(`${args.source}:conversation:${args.conversationId}`);
  if (args.internetMessageId) keys.add(`${args.source}:internet:${args.internetMessageId}`);

  const normalizedSubject = cleanSubject(args.subject);
  const normalizedFrom = String(args.from || '').toLowerCase().trim();
  if (normalizedSubject && normalizedFrom) keys.add(`${args.source}:subject-from:${normalizedFrom}:${normalizedSubject}`);

  return Array.from(keys);
}

export async function findExistingOrderForSource(companyId: string, keys: string[]) {
  if (!keys.length) return null;
  return prisma.order.findFirst({
    where: {
      companyId,
      sourceMessageId: { in: keys }
    },
    select: {
      id: true,
      status: true,
      sourceMessageId: true,
      subject: true,
      createdAt: true
    }
  });
}

export function choosePrimarySourceKey(keys: string[]) {
  return keys.find((key) => key.includes(':thread:')) || keys.find((key) => key.includes(':conversation:')) || keys[0] || null;
}
