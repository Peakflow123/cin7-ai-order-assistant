import { NextResponse } from 'next/server';
import { requireSession, isPlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const session = requireSession();
  const company = await prisma.company.findUnique({
    where: { id: session.companyId },
    include: { outlook: true }
  });

  if (!company) return new NextResponse('Company not found', { status: 404 });
  if (!company.isActive && !isPlatformAdmin(session)) return new NextResponse('Client account is inactive.', { status: 403 });

  const existingCount = company.outlook.length;
  const canReconnect = company.allowClientEmailReconnect || existingCount === 0 || isPlatformAdmin(session);

  if (!canReconnect) return new NextResponse('Outlook reconnect is disabled by admin.', { status: 403 });
  if (existingCount >= company.maxOutlookConnections) return new NextResponse('Outlook connection limit reached. Ask admin to increase the limit.', { status: 403 });

  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const redirectUri = process.env.MICROSOFT_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return new NextResponse('Set MICROSOFT_CLIENT_ID and MICROSOFT_REDIRECT_URI first', { status: 400 });
  }

  const state = Buffer.from(JSON.stringify({ companyId: session.companyId, userId: session.userId, returnTo: new URL(request.url).origin })).toString('base64url');

  const url = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_mode', 'query');
  url.searchParams.set('scope', 'offline_access User.Read Mail.Read');
  url.searchParams.set('state', state);
  url.searchParams.set('prompt', 'select_account');

  return NextResponse.redirect(url.toString());
}
