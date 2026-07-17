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
      password: String(body.password || ''),
      name: String(body.name || '').trim(),
      companyName: String(body.companyName || body.company || '').trim()
    };
  }

  const form = await request.formData();
  return {
    email: String(form.get('email') || '').trim().toLowerCase(),
    password: String(form.get('password') || ''),
    name: String(form.get('name') || '').trim(),
    companyName: String(form.get('companyName') || '').trim()
  };
}

export async function POST(request: Request) {
  const { email, password, name, companyName } = await readBody(request);

  if (!email || !password) {
    return NextResponse.redirect(new URL('/register?error=Email%20and%20password%20are%20required.', process.env.NEXT_PUBLIC_APP_URL || request.url));
  }

  if (password.length < 8) {
    return NextResponse.redirect(new URL('/register?error=Password%20must%20be%20at%20least%208%20characters.', process.env.NEXT_PUBLIC_APP_URL || request.url));
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.redirect(new URL('/register?error=This%20email%20is%20already%20registered.%20Please%20login%20instead.', process.env.NEXT_PUBLIC_APP_URL || request.url));
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const company = await prisma.company.create({ data: { name: companyName || name || email } });
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        passwordHash,
        companyId: company.id,
        role: 'CLIENT',
        sessionTimeoutMinutes: 720
      }
    });

    setSessionCookie(
      { userId: user.id, companyId: user.companyId, email: user.email, role: user.role },
      user.sessionTimeoutMinutes
    );

    return NextResponse.redirect(new URL('/dashboard', process.env.NEXT_PUBLIC_APP_URL || request.url));
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.redirect(new URL('/register?error=This%20email%20is%20already%20registered.%20Please%20login%20instead.', process.env.NEXT_PUBLIC_APP_URL || request.url));
    }

    return NextResponse.redirect(new URL('/register?error=Could%20not%20create%20account.', process.env.NEXT_PUBLIC_APP_URL || request.url));
  }
}
