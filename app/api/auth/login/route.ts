import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { setSessionCookie } from '@/lib/auth';

async function readBody(request: Request) {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const body = await request.json().catch(() => ({}));
    return {
      email: String(body.email || '').trim().toLowerCase(),
      password: String(body.password || '')
    };
  }

  const form = await request.formData();
  return {
    email: String(form.get('email') || '').trim().toLowerCase(),
    password: String(form.get('password') || '')
  };
}

export async function POST(request: Request) {
  const { email, password } = await readBody(request);

  if (!email || !password) {
    return NextResponse.redirect(new URL('/login?error=Email%20and%20password%20are%20required.', process.env.NEXT_PUBLIC_APP_URL || request.url));
  }

  const user = await prisma.user.findUnique({ where: { email }, include: { company: true } });
  if (!user || !user.company.isActive) {
    return NextResponse.redirect(new URL('/login?error=Invalid%20login%20or%20inactive%20account.', process.env.NEXT_PUBLIC_APP_URL || request.url));
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return NextResponse.redirect(new URL('/login?error=Invalid%20login.', process.env.NEXT_PUBLIC_APP_URL || request.url));
  }

  setSessionCookie(
    { userId: user.id, companyId: user.companyId, email: user.email, role: user.role },
    user.sessionTimeoutMinutes
  );

  const redirectUrl = user.role === 'ADMIN' || user.role === 'PLATFORM_ADMIN' ? '/admin' : '/dashboard';
  return NextResponse.redirect(new URL(redirectUrl, process.env.NEXT_PUBLIC_APP_URL || request.url));
}
