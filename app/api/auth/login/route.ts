import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { signSession } from '@/lib/auth';

export async function POST(request: Request) {
  const body = await request.json();
  const user = await prisma.user.findUnique({ where: { email: body.email } });

  if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
    return new NextResponse('Invalid login', { status: 401 });
  }

  cookies().set('session', signSession({ userId: user.id, companyId: user.companyId, email: user.email }), {
    httpOnly: true,
    path: '/',
    sameSite: 'lax'
  });

  return new NextResponse('ok');
}
