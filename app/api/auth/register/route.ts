import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { signSession } from '@/lib/auth';

export async function POST(request: Request) {
  const body = await request.json();

  if (!body.companyName || !body.email || !body.password) {
    return new NextResponse('Company, email and password are required', { status: 400 });
  }

  const company = await prisma.company.create({ data: { name: body.companyName } });
  const user = await prisma.user.create({
    data: {
      email: body.email,
      name: body.name || null,
      passwordHash: await bcrypt.hash(body.password, 10),
      companyId: company.id
    }
  });

  cookies().set('session', signSession({ userId: user.id, companyId: company.id, email: user.email }), {
    httpOnly: true,
    path: '/',
    sameSite: 'lax'
  });

  return new NextResponse('ok');
}
