import { NextResponse } from 'next/server';
import { google } from 'googleapis';
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

  if (!code) return new NextResponse('No Google authorization code returned.', { status: 400 });
  if (!state?.companyId) return new NextResponse('Invalid Google OAuth state.', { status: 400 });

  const company = await prisma.company.findUnique({ where: { id: state.companyId }, include: { gmail: true } });
  if (!company) return new NextResponse('Company not found.', { status: 404 });
  if (company.gmail.length >= company.maxGmailConnections) return new NextResponse('Gmail connection limit reached.', { status: 403 });

  const oauth2 = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
  const { tokens } = await oauth2.getToken(code);
  oauth2.setCredentials(tokens);

  let email: string | null = null;
  try {
    const oauth2Api = google.oauth2({ auth: oauth2, version: 'v2' });
    const profile = await oauth2Api.userinfo.get();
    email = profile.data.email || null;
  } catch {
    email = null;
  }

  await prisma.gmailConnection.create({
    data: {
      companyId: state.companyId,
      email,
      accessTokenEncrypted: encrypt(tokens.access_token || ''),
      refreshTokenEncrypted: encrypt(tokens.refresh_token || ''),
      expiryDate: tokens.expiry_date ? BigInt(tokens.expiry_date) : null,
      isActive: true
    }
  });

  return NextResponse.redirect(new URL('/email?connected=gmail', state.returnTo || url.origin));
}
