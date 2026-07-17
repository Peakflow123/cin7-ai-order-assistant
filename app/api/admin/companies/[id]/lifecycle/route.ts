import { NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logActivity } from '@/lib/activity';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = requirePlatformAdmin();
  const body = await request.json();
  const action = String(body.action || '');

  const company = await prisma.company.findUnique({ where: { id: params.id } });
  if (!company) return new NextResponse('Company not found.', { status: 404 });

  if (action === 'deactivate') {
    await prisma.company.update({ where: { id: company.id }, data: { isActive: false } });
    await logActivity({ session, companyId: company.id, action: 'COMPANY_DEACTIVATED', entityType: 'Company', entityId: company.id, message: `${company.name} deactivated.` });
    return NextResponse.json({ message: 'Client deactivated.' });
  }

  if (action === 'reactivate') {
    await prisma.company.update({ where: { id: company.id }, data: { isActive: true, isArchived: false, archivedAt: null } });
    await logActivity({ session, companyId: company.id, action: 'COMPANY_REACTIVATED', entityType: 'Company', entityId: company.id, message: `${company.name} reactivated.` });
    return NextResponse.json({ message: 'Client reactivated.' });
  }

  if (action === 'archive') {
    await prisma.company.update({ where: { id: company.id }, data: { isActive: false, isArchived: true, archivedAt: new Date() } });
    await logActivity({ session, companyId: company.id, action: 'COMPANY_ARCHIVED', entityType: 'Company', entityId: company.id, message: `${company.name} archived.` });
    return NextResponse.json({ message: 'Client archived.' });
  }

  if (action === 'unarchive') {
    await prisma.company.update({ where: { id: company.id }, data: { isArchived: false, archivedAt: null } });
    await logActivity({ session, companyId: company.id, action: 'COMPANY_UNARCHIVED', entityType: 'Company', entityId: company.id, message: `${company.name} unarchived.` });
    return NextResponse.json({ message: 'Client unarchived.' });
  }

  return new NextResponse('Invalid lifecycle action.', { status: 400 });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = requirePlatformAdmin();
  const body = await request.json().catch(() => ({}));
  const confirm = String(body.confirm || '');

  if (confirm !== 'DELETE') return new NextResponse('Type DELETE to confirm permanent deletion.', { status: 400 });

  const company = await prisma.company.findUnique({ where: { id: params.id } });
  if (!company) return new NextResponse('Company not found.', { status: 404 });
  if (company.id === session.companyId) return new NextResponse('You cannot delete the admin company you are currently logged into.', { status: 400 });

  await logActivity({ session, companyId: company.id, action: 'COMPANY_DELETE_STARTED', entityType: 'Company', entityId: company.id, message: `Permanent deletion started for ${company.name}.` });

  await prisma.$transaction(async (tx) => {
    const orders = await tx.order.findMany({ where: { companyId: company.id }, select: { id: true } });
    const orderIds = orders.map((order) => order.id);

    if (orderIds.length > 0) await tx.orderLine.deleteMany({ where: { orderId: { in: orderIds } } });
    await tx.orderFeedback.deleteMany({ where: { companyId: company.id } });
    await tx.productAlias.deleteMany({ where: { companyId: company.id } });
    await tx.customerAlias.deleteMany({ where: { companyId: company.id } });
    await tx.order.deleteMany({ where: { companyId: company.id } });
    await tx.product.deleteMany({ where: { companyId: company.id } });
    await tx.customer.deleteMany({ where: { companyId: company.id } });
    await tx.gmailConnection.deleteMany({ where: { companyId: company.id } });
    await tx.outlookConnection.deleteMany({ where: { companyId: company.id } });
    await tx.cin7Connection.deleteMany({ where: { companyId: company.id } });
    await tx.user.deleteMany({ where: { companyId: company.id } });
    await tx.activityLog.deleteMany({ where: { companyId: company.id } });
    await tx.systemLog.deleteMany({ where: { companyId: company.id } });
    await tx.company.delete({ where: { id: company.id } });
  });

  return NextResponse.json({ message: 'Client permanently deleted with all related data.' });
}
