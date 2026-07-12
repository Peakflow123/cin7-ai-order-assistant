import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  cookies().set('session', '', {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: 0
  });

  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'https://cin7-ai-order-assistant-three.vercel.app'));
}

export async function GET() {
  cookies().set('session', '', {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: 0
  });

  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'https://cin7-ai-order-assistant-three.vercel.app'));
}
