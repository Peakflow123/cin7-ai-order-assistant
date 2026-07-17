import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, isPlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getAllCompanyUsage } from '@/lib/admin-metrics';
import AdminClientControls from './AdminClientControls';
import ClientLifecycleButtons from './ClientLifecycleButtons';

export default async function AdminDashboard() {
  const session = getSession();
  if (!session) redirect('/login');
  if (!isPlatformAdmin(session)) redirect('/dashboard');

  const [companies, usageRows, totalOrders, users, needsReview, created, errors, gmail, outlook, feedback] = await Promise.all([
    prisma.company.findMany({ orderBy: { createdAt: 'desc' }, include: { _count: { select: { users: true, orders: true, gmail: true, outlook: true, products: true, customers: true } } } }),
    getAllCompanyUsage(),
    prisma.order.count(),
    prisma.user.count(),
    prisma.order.count({ where: { status: { in: ['NEW', 'NEEDS_REVIEW', 'READY'] } } }),
    prisma.order.count({ where: { status: 'CREATED' } }),
    prisma.order.count({ where: { status: 'ERROR' } }),
    prisma.gmailConnection.count({ where: { isActive: true } }),
    prisma.outlookConnection.count({ where: { isActive: true } }),
    prisma.orderFeedback.count()
  ]);

  const usageByCompany = new Map(usageRows.map((row) => [row.company.id, row.usage]));

  return (
    <main className="page-shell">
      <div className="admin-shell">
        <aside className="admin-sidebar space-y-5">
          <div><p className="badge badge-blue">Platform control</p><h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950">Admin Dashboard</h1><p className="mt-2 text-sm leading-6 text-slate-500">Control storage, lifecycle, activity, users and automation rules.</p></div>
          <nav className="space-y-2"><a className="nav-link-active block" href="#overview">Overview</a><a className="nav-link block" href="#storage">Storage</a><a className="nav-link block" href="#clients">Client Controls</a><Link className="nav-link block" href="/admin/activity">Activity</Link><Link className="nav-link block" href="/admin/logs">Logs</Link><Link className="nav-link block" href="/admin/users">Users</Link></nav>
        </aside>

        <section className="space-y-6">
          <section id="overview" className="hero-card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div><h2 className="page-title">Launch Command Center</h2><p className="page-subtitle">Monitor client usage, storage, activity and lifecycle from one admin area.</p></div>
            <div className="flex flex-wrap gap-2"><Link className="btn" href="/admin/activity">Activity</Link><Link className="btn-secondary" href="/admin/logs">Logs</Link></div>
          </section>

          <section className="grid gap-4 md:grid-cols-4 xl:grid-cols-9">
            <div className="stat-card"><p className="text-sm font-bold text-slate-500">Clients</p><p className="mt-2 text-3xl font-black">{companies.length}</p></div>
            <div className="stat-card"><p className="text-sm font-bold text-slate-500">Users</p><p className="mt-2 text-3xl font-black">{users}</p></div>
            <div className="stat-card"><p className="text-sm font-bold text-slate-500">Orders</p><p className="mt-2 text-3xl font-black">{totalOrders}</p></div>
            <div className="stat-card"><p className="text-sm font-bold text-slate-500">Review</p><p className="mt-2 text-3xl font-black text-blue-700">{needsReview}</p></div>
            <div className="stat-card"><p className="text-sm font-bold text-slate-500">Created</p><p className="mt-2 text-3xl font-black text-emerald-700">{created}</p></div>
            <div className="stat-card"><p className="text-sm font-bold text-slate-500">Errors</p><p className="mt-2 text-3xl font-black text-rose-700">{errors}</p></div>
            <div className="stat-card"><p className="text-sm font-bold text-slate-500">Gmail</p><p className="mt-2 text-3xl font-black">{gmail}</p></div>
            <div className="stat-card"><p className="text-sm font-bold text-slate-500">Outlook</p><p className="mt-2 text-3xl font-black">{outlook}</p></div>
            <div className="stat-card"><p className="text-sm font-bold text-slate-500">Feedback</p><p className="mt-2 text-3xl font-black">{feedback}</p></div>
          </section>

          <section id="storage" className="card overflow-x-auto">
            <div className="mb-4"><h2 className="text-2xl font-black">Client Storage Usage</h2><p className="text-sm text-slate-500">Estimated per-client storage for pricing and monitoring. Exact database-level size can be added later using database admin views.</p></div>
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="table-head"><tr><th className="px-4 py-3">Client</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Storage</th><th className="px-4 py-3">Products</th><th className="px-4 py-3">Customers</th><th className="px-4 py-3">Orders</th><th className="px-4 py-3">Lines</th><th className="px-4 py-3">Feedback</th><th className="px-4 py-3">Activity</th><th className="px-4 py-3">Logs</th></tr></thead>
              <tbody>
                {usageRows.map(({ company, usage }) => (
                  <tr key={company.id} className="table-row"><td className="px-4 py-4 font-black">{company.name}</td><td className="px-4 py-4"><span className={company.isArchived ? 'badge badge-yellow' : company.isActive ? 'badge badge-green' : 'badge badge-red'}>{company.isArchived ? 'Archived' : company.isActive ? 'Active' : 'Inactive'}</span></td><td className="px-4 py-4 font-black text-blue-700">{usage.estimatedStorage}</td><td className="px-4 py-4">{usage.products}</td><td className="px-4 py-4">{usage.customers}</td><td className="px-4 py-4">{usage.orders}</td><td className="px-4 py-4">{usage.orderLines}</td><td className="px-4 py-4">{usage.feedback}</td><td className="px-4 py-4">{usage.activity}</td><td className="px-4 py-4">{usage.logs}</td></tr>
                ))}
              </tbody>
            </table>
          </section>

          <section id="clients" className="space-y-4">
            <div><h2 className="text-2xl font-black tracking-tight text-slate-950">Client Lifecycle & Controls</h2><p className="text-sm text-slate-500">Deactivate, archive, permanently delete, and control allowed integrations.</p></div>
            <div className="space-y-4">
              {companies.map((company) => {
                const usage = usageByCompany.get(company.id);
                return <div key={company.id} className="admin-panel space-y-4"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><h3 className="text-xl font-black">{company.name}</h3><div className="mt-2 flex flex-wrap gap-2"><span className={company.isArchived ? 'badge badge-yellow' : company.isActive ? 'badge badge-green' : 'badge badge-red'}>{company.isArchived ? 'Archived' : company.isActive ? 'Active' : 'Inactive'}</span><span className="badge badge-blue">Storage {usage?.estimatedStorage || '0 B'}</span><span className="badge badge-gray">{company._count.orders} orders</span></div></div><ClientLifecycleButtons companyId={company.id} companyName={company.name} isActive={company.isActive} isArchived={company.isArchived} /></div></div>;
              })}
            </div>
            <AdminClientControls companies={companies} />
          </section>
        </section>
      </div>
    </main>
  );
}
