import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

function baseUrl(request: Request) {
  return process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
}

async function readBody(request: Request) {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const body = await request.json().catch(() => ({}));
    return { token: String(body.token || '').trim(), password: String(body.password || ''), confirm: String(body.confirm || '') };
  }
  const form = await request.formData();
  return { token: String(form.get('token') || '').trim(), password: String(form.get('password') || ''), confirm: String(form.get('confirm') || '') };
}

export async function POST(request: Request) {
  const app = baseUrl(request);
  const { token, password, confirm } = await readBody(request);

  if (!token) {
    return NextResponse.redirect(new URL('/forgot-password?error=Missing%20or%20invalid%20reset%20link.', app), { status: 303 });
  }
  if (!password || password.length < 8) {
    return NextResponse.redirect(new URL(`/reset-password?token=${encodeURIComponent(token)}&error=Password%20must%20be%20at%20least%208%20characters.`, app), { status: 303 });
  }
  if (password !== confirm) {
    return NextResponse.redirect(new URL(`/reset-password?token=${encodeURIComponent(token)}&error=Passwords%20do%20not%20match.`, app), { status: 303 });
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const record = await prisma.passwordResetToken.findFirst({
    where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } }
  });

  if (!record) {
    return NextResponse.redirect(new URL('/forgot-password?error=This%20reset%20link%20is%20invalid%20or%20has%20expired.', app), { status: 303 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.passwordResetToken.updateMany({ where: { userId: record.userId, usedAt: null }, data: { usedAt: new Date() } })
  ]);

  return NextResponse.redirect(new URL('/login?error=Password%20updated.%20Please%20login%20with%20your%20new%20password.', app), { status: 303 });
}
