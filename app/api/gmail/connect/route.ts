import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { requireSession, isPlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const session = requireSession();
  const company = await prisma.company.findUnique({ where: { id: session.companyId }, include: { gmail: true } });
  if (!company) return new NextResponse('Company not found', { status: 404 });
  if (!company.isActive && !isPlatformAdmin(session)) return new NextResponse('Client account is inactive.', { status: 403 });

  const existingCount = company.gmail.length;
  const canReconnect = company.allowClientEmailReconnect || existingCount === 0 || isPlatformAdmin(session);
  if (!canReconnect) return new NextResponse('Gmail reconnect is disabled by admin.', { status: 403 });
  if (existingCount >= company.maxGmailConnections) return new NextResponse('Gmail connection limit reached. Ask admin to increase the limit.', { status: 403 });

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
    return new NextResponse('Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI first', { status: 400 });
  }

  const oauth2 = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
  const state = Buffer.from(JSON.stringify({ companyId: session.companyId, userId: session.userId, returnTo: new URL(request.url).origin })).toString('base64url');

  const authUrl = oauth2.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent select_account',
    state,
    scope: ['https://www.googleapis.com/auth/gmail.readonly', 'openid', 'email']
  });

  return NextResponse.redirect(authUrl);
}
