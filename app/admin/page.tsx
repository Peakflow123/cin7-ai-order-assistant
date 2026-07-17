import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, isPlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import AdminClientControls from './AdminClientControls';

export default async function AdminDashboard() {
  const session = getSession();
  if (!session) redirect('/login');
  if (!isPlatformAdmin(session)) redirect('/dashboard');

  const [companies, totalOrders, needsReview, created, errors, gmail, outlook, feedback] = await Promise.all([
    prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { users: true, orders: true, gmail: true, outlook: true, products: true, customers: true } } }
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
    <main className="page-shell">
      <div className="admin-shell">
        <aside className="admin-sidebar space-y-5">
          <div>
            <p className="badge badge-blue">Platform control</p>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950">Admin Dashboard</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Control client access, connection limits, auto-create rules and launch readiness.</p>
          </div>
          <nav className="space-y-2">
            <a className="nav-link-active block" href="#overview">Overview</a>
            <a className="nav-link block" href="#clients">Client Controls</a>
            <Link className="nav-link block" href="/admin/clients">Client List</Link>
          </nav>
        </aside>

        <section className="space-y-6">
          <section id="overview" className="hero-card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="page-title">Command Center</h2>
              <p className="page-subtitle">A dedicated admin area separated from the client workspace.</p>
            </div>
            <Link className="btn-secondary" href="/dashboard">View client workspace</Link>
          </section>

          <section className="grid gap-4 md:grid-cols-4 xl:grid-cols-8">
            <div className="stat-card"><p className="text-sm font-bold text-slate-500">Clients</p><p className="mt-2 text-3xl font-black">{companies.length}</p></div>
            <div className="stat-card"><p className="text-sm font-bold text-slate-500">Orders</p><p className="mt-2 text-3xl font-black">{totalOrders}</p></div>
            <div className="stat-card"><p className="text-sm font-bold text-slate-500">Review</p><p className="mt-2 text-3xl font-black text-blue-700">{needsReview}</p></div>
            <div className="stat-card"><p className="text-sm font-bold text-slate-500">Created</p><p className="mt-2 text-3xl font-black text-emerald-700">{created}</p></div>
            <div className="stat-card"><p className="text-sm font-bold text-slate-500">Errors</p><p className="mt-2 text-3xl font-black text-rose-700">{errors}</p></div>
            <div className="stat-card"><p className="text-sm font-bold text-slate-500">Gmail</p><p className="mt-2 text-3xl font-black">{gmail}</p></div>
            <div className="stat-card"><p className="text-sm font-bold text-slate-500">Outlook</p><p className="mt-2 text-3xl font-black">{outlook}</p></div>
            <div className="stat-card"><p className="text-sm font-bold text-slate-500">Feedback</p><p className="mt-2 text-3xl font-black">{feedback}</p></div>
          </section>

          <section id="clients" className="space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-950">Client Controls</h2>
                <p className="text-sm text-slate-500">Manage activation, Gmail/Outlook limits, Cin7 edit permission and automation threshold.</p>
              </div>
              <Link className="btn-secondary" href="/admin/clients">Compact client list</Link>
            </div>
            <AdminClientControls companies={companies} />
          </section>
        </section>
      </div>
    </main>
  );
}
