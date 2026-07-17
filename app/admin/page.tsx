import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, isPlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

function statusClass(active: boolean) {
  return active ? 'badge badge-green' : 'badge badge-red';
}

export default async function AdminDashboard() {
  const session = getSession();
  if (!session) redirect('/login');
  if (!isPlatformAdmin(session)) redirect('/dashboard');

  const [companies, totalOrders, needsReview, created, errors, gmail, outlook, feedback] = await Promise.all([
    prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        _count: { select: { users: true, orders: true, gmail: true, outlook: true, products: true, customers: true } }
      }
    }),
    prisma.order.count(),
    prisma.order.count({ where: { status: { in: ['NEW', 'NEEDS_REVIEW', 'READY'] } } }),
    prisma.order.count({ where: { status: 'CREATED' } }),
    prisma.order.count({ where: { status: 'ERROR' } }),
    prisma.gmailConnection.count({ where: { isActive: true } }),
    prisma.outlookConnection.count({ where: { isActive: true } }),
    prisma.orderFeedback.count()
  ]);

  return (
    <main className="page-shell space-y-6">
      <section className="hero-card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="page-title">Platform Admin Dashboard</h1>
          <p className="page-subtitle">This is the separate admin workspace for managing clients, usage, integrations and operational health.</p>
        </div>
        <div className="flex gap-2"><Link className="btn" href="/admin/clients">Manage Clients</Link><Link className="btn-secondary" href="/admin">Refresh</Link></div>
      </section>

      <section className="grid gap-4 md:grid-cols-4 lg:grid-cols-8">
        <div className="stat-card"><p className="text-sm font-bold text-slate-500">Clients</p><p className="mt-2 text-3xl font-black">{companies.length}</p></div>
        <div className="stat-card"><p className="text-sm font-bold text-slate-500">Orders</p><p className="mt-2 text-3xl font-black">{totalOrders}</p></div>
        <div className="stat-card"><p className="text-sm font-bold text-slate-500">Needs Review</p><p className="mt-2 text-3xl font-black text-blue-700">{needsReview}</p></div>
        <div className="stat-card"><p className="text-sm font-bold text-slate-500">Created</p><p className="mt-2 text-3xl font-black text-emerald-700">{created}</p></div>
        <div className="stat-card"><p className="text-sm font-bold text-slate-500">Errors</p><p className="mt-2 text-3xl font-black text-rose-700">{errors}</p></div>
        <div className="stat-card"><p className="text-sm font-bold text-slate-500">Gmail</p><p className="mt-2 text-3xl font-black">{gmail}</p></div>
        <div className="stat-card"><p className="text-sm font-bold text-slate-500">Outlook</p><p className="mt-2 text-3xl font-black">{outlook}</p></div>
        <div className="stat-card"><p className="text-sm font-bold text-slate-500">Feedback</p><p className="mt-2 text-3xl font-black">{feedback}</p></div>
      </section>

      <section className="card">
        <div className="mb-5"><h2 className="text-xl font-black">Client Overview</h2><p className="text-sm text-slate-500">Separated from the client workspace. Use this dashboard to monitor onboarded companies.</p></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead><tr className="border-b border-slate-200 text-slate-500"><th className="py-3 pr-4">Client</th><th className="py-3 pr-4">Status</th><th className="py-3 pr-4">Users</th><th className="py-3 pr-4">Orders</th><th className="py-3 pr-4">Gmail</th><th className="py-3 pr-4">Outlook</th><th className="py-3 pr-4">Products</th><th className="py-3 pr-4">Customers</th></tr></thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id} className="border-b border-slate-100">
                  <td className="py-4 pr-4 font-bold text-slate-950">{company.name}</td>
                  <td className="py-4 pr-4"><span className={statusClass(company.isActive)}>{company.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td className="py-4 pr-4">{company._count.users}</td>
                  <td className="py-4 pr-4">{company._count.orders}</td>
                  <td className="py-4 pr-4">{company._count.gmail}</td>
                  <td className="py-4 pr-4">{company._count.outlook}</td>
                  <td className="py-4 pr-4">{company._count.products}</td>
                  <td className="py-4 pr-4">{company._count.customers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
