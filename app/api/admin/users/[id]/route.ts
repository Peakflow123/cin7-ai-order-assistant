import { NextResponse } from 'next/server';
import { requireSession, isPlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = requireSession();
  if (!isPlatformAdmin(session)) return new NextResponse('Forbidden', { status: 403 });
  if (params.id === session.userId) return new NextResponse('You cannot delete your own admin user.', { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: params.id } });
  if (!user) return new NextResponse('User not found.', { status: 404 });

  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ message: 'User deleted.' });
}
