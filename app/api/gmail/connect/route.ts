import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.email'
].join(' ');

export async function GET(request: Request) {
  try {
    const session = requireSession();

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT
        COALESCE("maxGmailConnections", 1) AS "maxGmailConnections",
        COALESCE("allowClientReconnectEmail", TRUE) AS "allowClientReconnectEmail"
       FROM "Company"
       WHERE "id" = $1
       LIMIT 1`,
      session.companyId
    );

    const company = rows[0] || { maxGmailConnections: 1, allowClientReconnectEmail: true };
    const activeCount = await prisma.gmailConnection.count({ where: { companyId: session.companyId, isActive: true } });
    const maxAllowed = Math.max(0, Number(company.maxGmailConnections || 1));
    const reconnectAllowed = Boolean(company.allowClientReconnectEmail);

    if (activeCount > 0 && !reconnectAllowed) {
      return new NextResponse('Gmail reconnect is disabled by admin.', { status: 403 });
    }

    if (activeCount >= maxAllowed) {
      return new NextResponse(`Gmail connection limit reached. Allowed: ${maxAllowed}.`, { status: 403 });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID || '';
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || '';
    if (!clientId || !redirectUri) return new NextResponse('Google OAuth is not configured.', { status: 500 });

    const state = Buffer.from(JSON.stringify({ companyId: session.companyId, userId: session.userId, ts: Date.now() })).toString('base64url');
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', GMAIL_SCOPES);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('include_granted_scopes', 'true');
    authUrl.searchParams.set('state', state);

    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Could not start Gmail connection.' }, { status: 500 });
  }
}
