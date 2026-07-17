import { prisma } from '@/lib/db';
import type { Session } from '@/lib/auth';

export async function logActivity(input: {
  session?: Session | null;
  companyId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  message?: string;
  metadata?: any;
}) {
  try {
    await prisma.activityLog.create({
      data: {
        companyId: input.companyId || input.session?.companyId || null,
        userId: input.session?.userId || null,
        actorEmail: input.session?.email || null,
        action: input.action,
        entityType: input.entityType || null,
        entityId: input.entityId || null,
        message: input.message || null,
        metadata: input.metadata || undefined
      }
    });
  } catch {
    // Activity logging must never break user-facing operations.
  }
}

export async function logSystem(input: {
  companyId?: string | null;
  level: 'INFO' | 'WARNING' | 'ERROR';
  source?: string;
  message: string;
  details?: any;
}) {
  try {
    await prisma.systemLog.create({
      data: {
        companyId: input.companyId || null,
        level: input.level,
        source: input.source || null,
        message: input.message,
        details: input.details || undefined
      }
    });
  } catch {
    // System logging must never break app flow.
  }
}
