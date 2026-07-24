import { NextResponse } from 'next/server';
import { getSession, isPlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logAdminActivity } from '@/lib/admin-control-center';

export async function POST(request: Request) {
  const session = getSession();
  if (!session || !isPlatformAdmin(session)) return new NextResponse('Unauthorized', { status: 401 });

  const form = await request.formData();
  const companyId = String(form.get('companyId') || '');
  if (!companyId) return new NextResponse('companyId is required', { status: 400 });

  const isActive = String(form.get('isActive')) === 'true';
  const isArchived = String(form.get('isArchived')) === 'true';
  const planName = String(form.get('planName') || 'Starter');
  const maxGmail = Number(form.get('maxGmailConnections') || 0);
  const maxOutlook = Number(form.get('maxOutlookConnections') || 0);
  const monthlyRaw = String(form.get('monthlyOrderLimit') || '').trim();
  const monthly = monthlyRaw ? Number(monthlyRaw) : null;
  const autoCreateEnabled = String(form.get('autoCreateEnabled')) === 'true';
  const thresholdRaw = Number(form.get('autoCreateThresholdPercent') || 95);
  const autoCreateThreshold = Math.max(0.5, Math.min(1, thresholdRaw / 100));
  const allowClientEditCin7Settings = String(form.get('allowClientEditCin7Settings')) === 'true';
  const allowClientReconnectEmail = String(form.get('allowClientReconnectEmail')) !== 'false';
  const adminNotes = String(form.get('adminNotes') || '').trim() || null;

  await prisma.$executeRawUnsafe(
    `UPDATE "Company" SET
      "isActive"=$1,
      "isArchived"=$2,
      "archivedAt"=$3,
      "planName"=$4,
      "maxGmailConnections"=$5,
      "maxOutlookConnections"=$6,
      "monthlyOrderLimit"=$7,
      "autoCreateEnabled"=$8,
      "autoCreateThreshold"=$9,
      "allowClientEditCin7Settings"=$10,
      "allowClientReconnectEmail"=$11,
      "adminNotes"=$12,
      "lastAdminActivityAt"=CURRENT_TIMESTAMP
    WHERE "id"=$13`,
    isActive,
    isArchived,
    isArchived ? new Date() : null,
    planName,
    maxGmail,
    maxOutlook,
    monthly,
    autoCreateEnabled,
    autoCreateThreshold,
    allowClientEditCin7Settings,
    allowClientReconnectEmail,
    adminNotes,
    companyId
  );

  await logAdminActivity({
    companyId,
    actorUserId: session.userId,
    actorEmail: session.email,
    action: 'CLIENT_CONTROLS_UPDATED',
    targetType: 'Company',
    targetId: companyId,
    message: 'Client controls updated from Admin Control Center',
    details: { isActive, isArchived, planName, maxGmail, maxOutlook, monthly, autoCreateEnabled, autoCreateThreshold, allowClientEditCin7Settings, allowClientReconnectEmail }
  });

  return NextResponse.redirect(new URL('/admin/launch/clients', request.url));
}
