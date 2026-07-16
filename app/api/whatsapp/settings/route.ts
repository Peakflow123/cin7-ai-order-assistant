import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { encrypt } from '@/lib/crypto';

export async function POST(request: Request) {
  const session = requireSession();
  const body = await request.json();
  const phoneNumberId = String(body.phoneNumberId || '').trim();
  const displayPhoneNumber = String(body.displayPhoneNumber || '').trim();
  const businessAccountId = String(body.businessAccountId || '').trim();
  const verifyToken = String(body.verifyToken || '').trim();
  const accessToken = String(body.accessToken || '').trim();

  if (!phoneNumberId || !verifyToken) return new NextResponse('Phone Number ID and Verify Token are required.', { status: 400 });

  const company = await prisma.company.findUnique({ where: { id: session.companyId }, include: { whatsapp: true } });
  if (!company) return new NextResponse('Company not found.', { status: 404 });

  const existing = company.whatsapp.find((item) => item.phoneNumberId === phoneNumberId);
  if (!existing && company.whatsapp.length >= company.maxWhatsappConnections) {
    return new NextResponse('WhatsApp connection limit reached. Ask admin to increase the limit.', { status: 403 });
  }

  await prisma.whatsappConnection.upsert({
    where: { companyId_phoneNumberId: { companyId: session.companyId, phoneNumberId } },
    update: {
      displayPhoneNumber: displayPhoneNumber || null,
      businessAccountId: businessAccountId || null,
      verifyToken,
      accessTokenEncrypted: accessToken ? encrypt(accessToken) : existing?.accessTokenEncrypted || null,
      isActive: true
    },
    create: {
      companyId: session.companyId,
      displayPhoneNumber: displayPhoneNumber || null,
      phoneNumberId,
      businessAccountId: businessAccountId || null,
      verifyToken,
      accessTokenEncrypted: accessToken ? encrypt(accessToken) : null,
      isActive: true
    }
  });

  return new NextResponse('WhatsApp connection saved. Configure Meta webhook URL next.');
}
