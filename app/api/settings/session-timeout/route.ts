import { NextResponse } from 'next/server';
import { requireSession, setSessionCookie } from '@/lib/auth';
import { prisma } from '@/lib/db';

const allowed = new Set([60, 360, 720, 0]);

export async function POST(request: Request) {
  const session = requireSession();
  const body = await request.json();
  const minutes = Number(body.sessionTimeoutMinutes);

  if (!allowed.has(minutes)) return new NextResponse('Invalid timeout option.', { status: 400 });

  const user = await prisma.user.update({
    where: { id: session.userId },
    data: { sessionTimeoutMinutes: minutes }
  });

  setSessionCookie({ userId: user.id, companyId: user.companyId, email: user.email, role: user.role }, user.sessionTimeoutMinutes);

  return NextResponse.json({ message: 'Session timeout updated.', sessionTimeoutMinutes: user.sessionTimeoutMinutes });
}
