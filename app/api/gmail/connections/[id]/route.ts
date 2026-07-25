import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

function wantsJson(request: Request) {
  const accept = request.headers.get('accept') || '';
  const contentType = request.headers.get('content-type') || '';
  return accept.includes('application/json') || contentType.includes('application/json');
}

async function removeGmailConnection(request: Request, connectionId: string) {
  const session = requireSession();

  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT COALESCE("allowClientReconnectEmail", TRUE) AS "allowClientReconnectEmail" FROM "Company" WHERE "id"=$1 LIMIT 1`,
    session.companyId
  );

  if (rows.length > 0 && !Boolean(rows[0].allowClientReconnectEmail)) {
    if (wantsJson(request)) return NextResponse.json({ message: 'Gmail reconnect/removal is disabled by admin.' }, { status: 403 });
    return NextResponse.redirect(new URL('/email?message=gmail-removal-disabled', request.url), 303);
  }

  const connection = await prisma.gmailConnection.findFirst({ where: { id: connectionId, companyId: session.companyId } });
  if (!connection) {
    if (wantsJson(request)) return NextResponse.json({ message: 'Gmail connection not found.' }, { status: 404 });
    return NextResponse.redirect(new URL('/email?message=gmail-not-found', request.url), 303);
  }

  await prisma.gmailConnection.update({ where: { id: connection.id }, data: { isActive: false } });

  if (wantsJson(request)) return NextResponse.json({ message: 'Gmail connection removed. You can connect another mailbox now.' });
  return NextResponse.redirect(new URL('/email?removed=gmail', request.url), 303);
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  return removeGmailConnection(request, params.id);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  return removeGmailConnection(request, params.id);
}
