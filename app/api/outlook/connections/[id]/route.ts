import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

async function removeOutlookConnection(connectionId: string) {
  const session = requireSession();

  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT COALESCE("allowClientReconnectEmail", TRUE) AS "allowClientReconnectEmail" FROM "Company" WHERE "id"=$1 LIMIT 1`,
    session.companyId
  );
  if (rows.length > 0 && !Boolean(rows[0].allowClientReconnectEmail)) {
    return NextResponse.json({ message: 'Outlook reconnect/removal is disabled by admin.' }, { status: 403 });
  }

  const connection = await prisma.outlookConnection.findFirst({ where: { id: connectionId, companyId: session.companyId } });
  if (!connection) return NextResponse.json({ message: 'Outlook connection not found.' }, { status: 404 });

  await prisma.outlookConnection.update({ where: { id: connection.id }, data: { isActive: false } });
  return NextResponse.json({ message: 'Outlook connection removed. You can connect another mailbox now.' });
}

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  return removeOutlookConnection(params.id);
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  return removeOutlookConnection(params.id);
}
