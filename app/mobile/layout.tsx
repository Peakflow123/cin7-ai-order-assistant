import { redirect } from 'next/navigation';
import { getSession, isPlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import ClientPortalFrame from '@/components/ClientPortalFrame';

export default async function MobileLayout({ children }: { children: React.ReactNode }) {
  const session = getSession();
  if (!session) redirect('/login');
  if (isPlatformAdmin(session)) redirect('/admin');
  const company = await prisma.company.findUnique({ where: { id: session.companyId }, select: { name: true } });
  return <ClientPortalFrame companyName={company?.name}>{children}</ClientPortalFrame>;
}
