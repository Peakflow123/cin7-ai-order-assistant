import { NextResponse } from 'next/server';
import { requireSession, isPlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

function asBool(value: unknown) {
  return value === true || value === 'true' || value === 'on' || value === 1;
}

function asInt(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : fallback;
}

function asFloat(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = requireSession();
  if (!isPlatformAdmin(session)) return new NextResponse('Forbidden', { status: 403 });

  const body = await request.json();
  const existing = await prisma.company.findUnique({ where: { id: params.id } });
  if (!existing) return new NextResponse('Company not found', { status: 404 });

  const updated = await prisma.company.update({
    where: { id: params.id },
    data: {
      name: String(body.name || existing.name).trim(),
      isActive: asBool(body.isActive),
      allowClientCin7Edit: asBool(body.allowClientCin7Edit),
      autoCreateEnabled: asBool(body.autoCreateEnabled),
      autoCreateThreshold: asFloat(body.autoCreateThreshold, existing.autoCreateThreshold),
      allowClientEmailReconnect: asBool(body.allowClientEmailReconnect),
      maxGmailConnections: asInt(body.maxGmailConnections, existing.maxGmailConnections),
      maxOutlookConnections: asInt(body.maxOutlookConnections, existing.maxOutlookConnections),
      maxWhatsappConnections: 0
    }
  });

  return NextResponse.json({ message: 'Client controls updated.', company: updated });
}
