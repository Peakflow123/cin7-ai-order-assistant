import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = requireSession();
    const company = await prisma.company.findUnique({
      where: { id: session.companyId },
      select: { name: true }
    });
    return NextResponse.json({ name: company?.name || 'Your company' });
  } catch {
    return NextResponse.json({ name: 'Your company' }, { status: 401 });
  }
}
