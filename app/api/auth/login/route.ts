import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { setSessionCookie } from '@/lib/auth';

export async function POST(request: Request) {
  const body = await request.formData().catch(() => null);
  const jsonBody = body ? null : await request.json().catch(() => ({}));

  const email = String(body?.get('email') || jsonBody?.email || '').trim().toLowerCase();
  const password = String(body?.get('password') || jsonBody?.password || '');

  if (!email || !password) return new NextResponse('Email and password are required.', { status: 400 });

  const user = await prisma.user.findUnique({ where: { email }, include: { company: true } });
  if (!user || !user.company.isActive) return new NextResponse('Invalid login or inactive account.', { status: 401 });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return new NextResponse('Invalid login.', { status: 401 });

  setSessionCookie({ userId: user.id, companyId: user.companyId, email: user.email, role: user.role }, user.sessionTimeoutMinutes);

  const redirectUrl = user.role === 'ADMIN' || user.role === 'PLATFORM_ADMIN' ? '/admin' : '/dashboard';
  return NextResponse.redirect(new URL(redirectUrl, process.env.NEXT_PUBLIC_APP_URL || request.url));
}
