import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { prisma } from '@/lib/db';
import { encrypt } from '@/lib/crypto';

function parseState(value: string | null) {
  if (!value) throw new Error('Missing OAuth state.');
  try {
    return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as { companyId: string; userId?: string; ts?: number };
  } catch {
    throw new Error('Invalid OAuth state.');
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = parseState(url.searchParams.get('state'));
    if (!code) throw new Error('Missing Google authorization code.');

    const companyRows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT COALESCE("maxGmailConnections", 1) AS "maxGmailConnections" FROM "Company" WHERE "id"=$1 LIMIT 1`,
      state.companyId
    );
    const maxAllowed = Math.max(0, Number(companyRows[0]?.maxGmailConnections || 1));

    const oauth2 = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
    const tokenResult = await oauth2.getToken(code);
    const tokens = tokenResult.tokens;
    oauth2.setCredentials(tokens);

    const oauth2Api = google.oauth2({ version: 'v2', auth: oauth2 });
    const profile = await oauth2Api.userinfo.get();
    const email = String(profile.data.email || '').trim().toLowerCase();
    if (!email) throw new Error('Could not read Gmail account email.');

    const existingSameEmail = await prisma.gmailConnection.findFirst({ where: { companyId: state.companyId, email } });
    const activeCountExcludingSame = await prisma.gmailConnection.count({
      where: {
        companyId: state.companyId,
        isActive: true,
        ...(existingSameEmail ? { id: { not: existingSameEmail.id } } : {})
      }
    });

    // Only active connections count. Reconnecting the same previously removed mailbox reuses the old row.
    if (activeCountExcludingSame >= maxAllowed) {
      return NextResponse.redirect(new URL(`/email?error=gmail-limit&allowed=${maxAllowed}`, request.url), 303);
    }

    const accessToken = tokens.access_token || '';
    const refreshToken = tokens.refresh_token || '';
    const expiryDate = tokens.expiry_date ? BigInt(tokens.expiry_date) : null;

    if (existingSameEmail) {
      const data: any = {
        accessTokenEncrypted: encrypt(accessToken),
        isActive: true,
        email,
        lastCheckedAt: null
      };
      if (refreshToken) data.refreshTokenEncrypted = encrypt(refreshToken);
      if (expiryDate) data.expiryDate = expiryDate;
      await prisma.gmailConnection.update({ where: { id: existingSameEmail.id }, data });
    } else {
      if (!refreshToken) throw new Error('Google did not return a refresh token. Please try again and approve offline access.');
      await prisma.gmailConnection.create({
        data: {
          companyId: state.companyId,
          email,
          accessTokenEncrypted: encrypt(accessToken),
          refreshTokenEncrypted: encrypt(refreshToken),
          expiryDate,
          isActive: true
        }
      });
    }

    return NextResponse.redirect(new URL('/email?connected=gmail', request.url), 303);
  } catch (error) {
    const message = encodeURIComponent(error instanceof Error ? error.message : 'Gmail connection failed.');
    return NextResponse.redirect(new URL(`/email?error=${message}`, request.url), 303);
  }
}
