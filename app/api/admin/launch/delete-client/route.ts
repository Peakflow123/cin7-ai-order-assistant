import { NextResponse } from 'next/server';
import { getSession, isPlatformAdmin } from '@/lib/auth';
import { permanentDeleteCompany, logActivity } from '@/lib/admin-launch-safe';

export async function POST(request: Request) {
  const session = getSession();
  if (!session || !isPlatformAdmin(session)) return new NextResponse('Unauthorized', { status: 401 });
  const form = await request.formData();
  const companyId = String(form.get('companyId') || '');
  const confirm = String(form.get('confirm') || '');
  if (!companyId || confirm !== 'DELETE') return new NextResponse('Type DELETE to confirm permanent deletion.', { status: 400 });
  await logActivity({ companyId, actorUserId: session.userId, actorEmail: session.email, action: 'CLIENT_PERMANENT_DELETE', targetType: 'Company', targetId: companyId, message: 'Permanent delete requested' });
  await permanentDeleteCompany(companyId);
  return NextResponse.redirect(new URL('/admin/launch/clients?deleted=1', request.url));
}
