import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { encrypt } from '@/lib/crypto';

type OAuthState = {
  companyId: string;
  userId: string;
  returnTo?: string;
};

function parseState(value: string | null): OAuthState | null {
  if (!value) return null;
  try {
    return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as OAuthState;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = parseState(url.searchParams.get('state'));

  if (!code) return new NextResponse('No Microsoft authorization code returned.', { status: 400 });
  if (!state?.companyId) return new NextResponse('Invalid Microsoft OAuth state.', { status: 400 });

  const company = await prisma.company.findUnique({
    where: { id: state.companyId },
    include: { outlook: true }
  });

  if (!company) return new NextResponse('Company not found.', { status: 404 });
  if (company.outlook.length >= company.maxOutlookConnections) return new NextResponse('Outlook connection limit reached.', { status: 403 });

  const body = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID || '',
    client_secret: process.env.MICROSOFT_CLIENT_SECRET || '',
    code,
    redirect_uri: process.env.MICROSOFT_REDIRECT_URI || '',
    grant_type: 'authorization_code',
    scope: 'offline_access User.Read Mail.Read'
  });

  const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  const tokens = await tokenResponse.json();
  if (!tokenResponse.ok) return NextResponse.json(tokens, { status: 400 });

  let email: string | null = null;
  try {
    const meResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    const me = await meResponse.json();
    email = me.mail || me.userPrincipalName || null;
  } catch {
    email = null;
  }

  await prisma.outlookConnection.create({
    data: {
      companyId: state.companyId,
      email,
      accessTokenEncrypted: encrypt(tokens.access_token || ''),
      refreshTokenEncrypted: encrypt(tokens.refresh_token || ''),
      expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
      isActive: true
    }
  });

  return NextResponse.redirect(new URL('/email?connected=outlook', state.returnTo || url.origin));
}
