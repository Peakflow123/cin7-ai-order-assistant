import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, isPlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export default async function AdminClientsPage() {
  const session = getSession();
  if (!session) redirect('/login');
  if (!isPlatformAdmin(session)) redirect('/dashboard');

  const companies = await prisma.company.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { users: true, orders: true, gmail: true, outlook: true } } }
  });

  return (
    <main className="page-shell space-y-6">
      <section className="hero-card"><Link href="/admin" className="text-sm font-bold text-blue-700">← Back to Admin</Link><h1 className="page-title mt-2">Clients</h1><p className="page-subtitle">Central client list. More client edit controls can be added here next.</p></section>
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {companies.map((company) => (
          <div key={company.id} className="card space-y-3">
            <div className="flex items-start justify-between gap-2"><h2 className="text-xl font-black">{company.name}</h2><span className={company.isActive ? 'badge badge-green' : 'badge badge-red'}>{company.isActive ? 'Active' : 'Inactive'}</span></div>
            <div className="grid grid-cols-2 gap-2 text-sm"><div className="soft-panel"><b>{company._count.users}</b><br />Users</div><div className="soft-panel"><b>{company._count.orders}</b><br />Orders</div><div className="soft-panel"><b>{company._count.gmail}</b><br />Gmail</div><div className="soft-panel"><b>{company._count.outlook}</b><br />Outlook</div></div>
          </div>
        ))}
      </section>
    </main>
  );
}
