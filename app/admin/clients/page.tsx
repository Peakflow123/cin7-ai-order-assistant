import { redirect } from 'next/navigation';
import { getSession, isPlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import AdminNav from '../AdminNav';
import AdminClientControls from '../AdminClientControls';
import ClientLifecycleButtons from '../ClientLifecycleButtons';
import AdminCin7SyncButton from '../AdminCin7SyncButton';
import { getAllCompanyUsage } from '@/lib/admin-metrics';

export default async function AdminClientsPage() {
  const session = getSession();
  if (!session) redirect('/login');
  if (!isPlatformAdmin(session)) redirect('/dashboard');

  const [companies, usageRows] = await Promise.all([
    prisma.company.findMany({ orderBy: { createdAt: 'desc' }, include: { cin7: true, syncState: true, _count: { select: { users: true, orders: true, gmail: true, outlook: true, products: true, customers: true } } } }),
    getAllCompanyUsage()
  ]);

  const usageByCompany = new Map(usageRows.map((row) => [row.company.id, row.usage]));

  return (
    <main className="page-shell">
      <div className="admin-shell">
        <AdminNav active="/admin/clients" />
        <section className="space-y-6 min-w-0">
          <section className="hero-card"><h1 className="page-title">Clients & Controls</h1><p className="page-subtitle">Client lifecycle, limits, automation controls and admin-triggered Cin7 refresh.</p></section>
          <section className="space-y-4">
            {companies.map((company) => {
              const usage = usageByCompany.get(company.id);
              return (
                <article key={company.id} className="admin-panel space-y-4">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div><h2 className="text-xl font-black">{company.name}</h2><div className="mt-2 flex flex-wrap gap-2"><span className={company.isArchived ? 'badge badge-yellow' : company.isActive ? 'badge badge-green' : 'badge badge-red'}>{company.isArchived ? 'Archived' : company.isActive ? 'Active' : 'Inactive'}</span><span className="badge badge-blue">Storage {usage?.estimatedStorage || '0 B'}</span><span className="badge badge-gray">{company._count.products} products</span><span className="badge badge-gray">{company._count.customers} customers</span><span className="badge badge-gray">{company._count.orders} orders</span></div>{company.syncState?.lastSyncMessage && <p className="mt-2 text-xs text-slate-500">Last sync: {company.syncState.lastSyncMessage}</p>}</div>
                    <div className="flex flex-col gap-2"><ClientLifecycleButtons companyId={company.id} companyName={company.name} isActive={company.isActive} isArchived={company.isArchived} /><AdminCin7SyncButton companyId={company.id} hasCin7={Boolean(company.cin7)} /></div>
                  </div>
                </article>
              );
            })}
          </section>
          <AdminClientControls companies={companies} />
        </section>
      </div>
    </main>
  );
}
