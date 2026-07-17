import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';

export async function POST(request: Request) {
  clearSessionCookie();
  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL || request.url));
}

export async function GET(request: Request) {
  clearSessionCookie();
  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL || request.url));
}
