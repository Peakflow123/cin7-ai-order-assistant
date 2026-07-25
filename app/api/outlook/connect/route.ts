import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

const OUTLOOK_SCOPES = 'offline_access User.Read Mail.Read';

export async function GET() {
  try {
    const session = requireSession();

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT
        COALESCE("maxOutlookConnections", 1) AS "maxOutlookConnections",
        COALESCE("allowClientReconnectEmail", TRUE) AS "allowClientReconnectEmail"
       FROM "Company"
       WHERE "id" = $1
       LIMIT 1`,
      session.companyId
    );

    const company = rows[0] || { maxOutlookConnections: 1, allowClientReconnectEmail: true };
    const activeCount = await prisma.outlookConnection.count({ where: { companyId: session.companyId, isActive: true } });
    const maxAllowed = Math.max(0, Number(company.maxOutlookConnections || 1));
    const reconnectAllowed = Boolean(company.allowClientReconnectEmail);

    // Only currently active connections count against the limit.
    if (activeCount > 0 && !reconnectAllowed) {
      return new NextResponse('Outlook reconnect is disabled by admin.', { status: 403 });
    }

    if (activeCount >= maxAllowed) {
      return new NextResponse(`Outlook connection limit reached. Active connections: ${activeCount}. Allowed: ${maxAllowed}.`, { status: 403 });
    }

    const clientId = process.env.MICROSOFT_CLIENT_ID || '';
    const redirectUri = process.env.MICROSOFT_REDIRECT_URI || '';
    if (!clientId || !redirectUri) return new NextResponse('Microsoft OAuth is not configured.', { status: 500 });

    const state = Buffer.from(JSON.stringify({ companyId: session.companyId, userId: session.userId, ts: Date.now() })).toString('base64url');
    const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_mode', 'query');
    authUrl.searchParams.set('scope', OUTLOOK_SCOPES);
    authUrl.searchParams.set('prompt', 'select_account');
    authUrl.searchParams.set('state', state);

    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Could not start Outlook connection.' }, { status: 500 });
  }
}
