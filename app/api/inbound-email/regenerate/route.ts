import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
export async function POST() {
  const session = requireSession();
  const token = crypto.randomBytes(18).toString('hex');
  await prisma.$executeRawUnsafe(`UPDATE "Company" SET "inboundEmailToken"=$1, "inboundEmailEnabled"=TRUE WHERE "id"=$2`, token, session.companyId);
  const domain = process.env.INBOUND_EMAIL_DOMAIN || 'orders.nexorderai.com';
  return NextResponse.json({ address: `orders-${token}@${domain}` });
}
