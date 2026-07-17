import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { setSessionCookie } from '@/lib/auth';

export async function POST(request: Request) {
  const body = await request.formData().catch(() => null);
  const jsonBody = body ? null : await request.json().catch(() => ({}));

  const email = String(body?.get('email') || jsonBody?.email || '').trim().toLowerCase();
  const password = String(body?.get('password') || jsonBody?.password || '');
  const name = String(body?.get('name') || jsonBody?.name || '').trim();
  const companyName = String(body?.get('companyName') || jsonBody?.companyName || name || email).trim();

  if (!email || !password) return new NextResponse('Email and password are required.', { status: 400 });
  if (password.length < 8) return new NextResponse('Password must be at least 8 characters.', { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return new NextResponse('This email is already registered. Please login instead.', { status: 409 });

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const company = await prisma.company.create({ data: { name: companyName || email } });
    const user = await prisma.user.create({ data: { email, name: name || null, passwordHash, companyId: company.id, role: 'CLIENT', sessionTimeoutMinutes: 720 } });

    setSessionCookie({ userId: user.id, companyId: user.companyId, email: user.email, role: user.role }, user.sessionTimeoutMinutes);
    return NextResponse.redirect(new URL('/dashboard', process.env.NEXT_PUBLIC_APP_URL || request.url));
  } catch (error: any) {
    if (error?.code === 'P2002') return new NextResponse('This email is already registered. Please login instead.', { status: 409 });
    return new NextResponse('Could not create account.', { status: 500 });
  }
}
