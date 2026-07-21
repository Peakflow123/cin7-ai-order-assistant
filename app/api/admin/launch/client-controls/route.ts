import { NextResponse } from 'next/server';
import { getSession, isPlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logActivity } from '@/lib/admin-launch-safe';

export async function POST(request: Request) {
  const session = getSession();
  if (!session || !isPlatformAdmin(session)) return new NextResponse('Unauthorized', { status: 401 });
  const form = await request.formData();
  const companyId = String(form.get('companyId') || '');
  if (!companyId) return new NextResponse('companyId is required', { status: 400 });
  const isActive = String(form.get('isActive')) === 'true';
  const isArchived = String(form.get('isArchived')) === 'true';
  const planName = String(form.get('planName') || 'Starter');
  const maxGmail = Number(form.get('maxGmailConnections') || 1);
  const maxOutlook = Number(form.get('maxOutlookConnections') || 1);
  const monthlyRaw = String(form.get('monthlyOrderLimit') || '').trim();
  const monthly = monthlyRaw ? Number(monthlyRaw) : null;

  await prisma.$executeRawUnsafe(
    `UPDATE "Company" SET "isActive"=$1, "isArchived"=$2, "archivedAt"=$3, "planName"=$4, "maxGmailConnections"=$5, "maxOutlookConnections"=$6, "monthlyOrderLimit"=$7, "lastAdminActivityAt"=CURRENT_TIMESTAMP WHERE "id"=$8`,
    isActive, isArchived, isArchived ? new Date() : null, planName, maxGmail, maxOutlook, monthly, companyId
  );
  await logActivity({ companyId, actorUserId: session.userId, actorEmail: session.email, action: 'CLIENT_CONTROLS_UPDATED', targetType: 'Company', targetId: companyId, message: `Client controls updated`, details: { isActive, isArchived, planName, maxGmail, maxOutlook, monthly } });
  return NextResponse.redirect(new URL('/admin/launch/clients', request.url));
}
