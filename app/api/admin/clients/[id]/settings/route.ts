import { NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  requirePlatformAdmin();
  const body = await request.json();

  const threshold = Number(body.autoCreateThreshold);

  await prisma.company.update({
    where: { id: params.id },
    data: {
      allowClientCin7Edit: Boolean(body.allowClientCin7Edit),
      autoCreateEnabled: Boolean(body.autoCreateEnabled),
      autoCreateThreshold: Number.isFinite(threshold) ? Math.min(1, Math.max(0, threshold)) : 0.9
    }
  });

  return new NextResponse('Client settings saved.');
}
