import { NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

function cleanInt(value: unknown, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.floor(parsed));
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  requirePlatformAdmin();
  const body = await request.json();
  const threshold = Number(body.autoCreateThreshold);

  await prisma.company.update({
    where: { id: params.id },
    data: {
      isActive: Boolean(body.isActive),
      allowClientCin7Edit: Boolean(body.allowClientCin7Edit),
      allowClientEmailReconnect: Boolean(body.allowClientEmailReconnect),
      autoCreateEnabled: Boolean(body.autoCreateEnabled),
      autoCreateThreshold: Number.isFinite(threshold) ? Math.min(1, Math.max(0, threshold)) : 0.9,
      maxOutlookConnections: cleanInt(body.maxOutlookConnections, 1),
      maxGmailConnections: cleanInt(body.maxGmailConnections, 1),
      maxWhatsappConnections: cleanInt(body.maxWhatsappConnections, 1)
    }
  });

  return new NextResponse('Client settings saved.');
}
