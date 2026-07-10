import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { encrypt } from '@/lib/crypto';

export async function GET(request: Request) {
  const session = requireSession();
  const code = new URL(request.url).searchParams.get('code');

  if (!code) return new NextResponse('No code', { status: 400 });

  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const { tokens } = await oauth2.getToken(code);

  await prisma.gmailConnection.upsert({
    where: { companyId: session.companyId },
    update: {
      accessTokenEncrypted: encrypt(tokens.access_token || ''),
      refreshTokenEncrypted: encrypt(tokens.refresh_token || ''),
      expiryDate: tokens.expiry_date ? BigInt(tokens.expiry_date) : null
    },
    create: {
      companyId: session.companyId,
      accessTokenEncrypted: encrypt(tokens.access_token || ''),
      refreshTokenEncrypted: encrypt(tokens.refresh_token || ''),
      expiryDate: tokens.expiry_date ? BigInt(tokens.expiry_date) : null
    }
  });

  return NextResponse.redirect(new URL('/email', request.url));
}
