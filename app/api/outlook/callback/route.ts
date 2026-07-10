import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { encrypt } from '@/lib/crypto';

export async function GET(request: Request) {
  const session = requireSession();
  const code = new URL(request.url).searchParams.get('code');

  if (!code) return new NextResponse('No code', { status: 400 });

  const body = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID || '',
    client_secret: process.env.MICROSOFT_CLIENT_SECRET || '',
    code,
    redirect_uri: process.env.MICROSOFT_REDIRECT_URI || '',
    grant_type: 'authorization_code'
  });

  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', { method: 'POST', body });
  const tokens = await response.json();

  await prisma.outlookConnection.upsert({
    where: { companyId: session.companyId },
    update: {
      accessTokenEncrypted: encrypt(tokens.access_token || ''),
      refreshTokenEncrypted: encrypt(tokens.refresh_token || ''),
      expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null
    },
    create: {
      companyId: session.companyId,
      accessTokenEncrypted: encrypt(tokens.access_token || ''),
      refreshTokenEncrypted: encrypt(tokens.refresh_token || ''),
      expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null
    }
  });

  return NextResponse.redirect(new URL('/email', request.url));
}
