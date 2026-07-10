import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const redirectUri = process.env.MICROSOFT_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return new NextResponse('Set MICROSOFT_CLIENT_ID and MICROSOFT_REDIRECT_URI first', { status: 400 });
  }

  const url = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent('offline_access Mail.Read User.Read')}`;
  return NextResponse.redirect(url);
}
