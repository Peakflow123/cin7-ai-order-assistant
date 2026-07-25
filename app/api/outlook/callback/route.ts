import { NextResponse } from 'next/server';
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

async function graphFetch(accessToken: string, path: string) {
  const response = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`Microsoft Graph error: ${JSON.stringify(data).slice(0, 500)}`);
  return data;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = parseState(url.searchParams.get('state'));
    if (!code) throw new Error('Missing Microsoft authorization code.');

    const companyRows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT COALESCE("maxOutlookConnections", 1) AS "maxOutlookConnections" FROM "Company" WHERE "id"=$1 LIMIT 1`,
      state.companyId
    );
    const maxAllowed = Math.max(0, Number(companyRows[0]?.maxOutlookConnections || 1));

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
    if (!tokenResponse.ok) throw new Error(`Microsoft token exchange failed: ${JSON.stringify(tokens).slice(0, 500)}`);

    const me = await graphFetch(tokens.access_token, '/me?$select=mail,userPrincipalName,displayName');
    const email = String(me.mail || me.userPrincipalName || '').trim().toLowerCase();
    if (!email) throw new Error('Could not read Outlook account email.');

    const existingSameEmail = await prisma.outlookConnection.findFirst({ where: { companyId: state.companyId, email } });
    const activeCountExcludingSame = await prisma.outlookConnection.count({
      where: {
        companyId: state.companyId,
        isActive: true,
        ...(existingSameEmail ? { id: { not: existingSameEmail.id } } : {})
      }
    });

    // Only active connections count. Reconnecting the same previously removed mailbox reuses the old row.
    if (activeCountExcludingSame >= maxAllowed) {
      return NextResponse.redirect(new URL(`/email?error=outlook-limit&allowed=${maxAllowed}`, request.url), 303);
    }

    const expiresAt = tokens.expires_in ? new Date(Date.now() + Number(tokens.expires_in) * 1000) : null;

    if (existingSameEmail) {
      const data: any = {
        email,
        accessTokenEncrypted: encrypt(tokens.access_token || ''),
        isActive: true,
        lastCheckedAt: null
      };
      if (tokens.refresh_token) data.refreshTokenEncrypted = encrypt(tokens.refresh_token);
      if (expiresAt) data.expiresAt = expiresAt;
      await prisma.outlookConnection.update({ where: { id: existingSameEmail.id }, data });
    } else {
      if (!tokens.refresh_token) throw new Error('Microsoft did not return a refresh token. Please try again.');
      await prisma.outlookConnection.create({
        data: {
          companyId: state.companyId,
          email,
          accessTokenEncrypted: encrypt(tokens.access_token || ''),
          refreshTokenEncrypted: encrypt(tokens.refresh_token || ''),
          expiresAt,
          isActive: true
        }
      });
    }

    return NextResponse.redirect(new URL('/email?connected=outlook', request.url), 303);
  } catch (error) {
    const message = encodeURIComponent(error instanceof Error ? error.message : 'Outlook connection failed.');
    return NextResponse.redirect(new URL(`/email?error=${message}`, request.url), 303);
  }
}
