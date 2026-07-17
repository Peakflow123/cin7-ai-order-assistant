import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, isPlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import AdminNav from './AdminNav';

export default async function AdminDashboard() {
  const session = getSession();
  if (!session) redirect('/login');
  if (!isPlatformAdmin(session)) redirect('/dashboard');

  const [clients, activeClients, archivedClients, totalOrders, users, needsReview, created, errors, gmail, outlook, feedback, recentActivity] = await Promise.all([
    prisma.company.count(),
    prisma.company.count({ where: { isActive: true, isArchived: false } }),
    prisma.company.count({ where: { isArchived: true } }),
    prisma.order.count(),
    prisma.user.count(),
    prisma.order.count({ where: { status: { in: ['NEW', 'NEEDS_REVIEW', 'READY'] } } }),
    prisma.order.count({ where: { status: 'CREATED' } }),
    prisma.order.count({ where: { status: 'ERROR' } }),
    prisma.gmailConnection.count({ where: { isActive: true } }),
    prisma.outlookConnection.count({ where: { isActive: true } }),
    prisma.orderFeedback.count(),
    prisma.activityLog.findMany({ orderBy: { createdAt: 'desc' }, take: 8, include: { company: { select: { name: true } } } }).catch(() => [])
  ]);

  return (
    <main className="page-shell">
      <div className="admin-shell">
        <AdminNav active="/admin" />
        <section className="space-y-6 min-w-0">
          <section className="hero-card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="page-title">Launch Command Center</h2>
              <p className="page-subtitle">Fast overview only. Detailed storage, lifecycle controls, activity and logs are now on separate pages.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link className="btn" href="/admin/clients">Manage Clients</Link>
              <Link className="btn-secondary" href="/admin/storage">Storage</Link>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            <div className="stat-card"><p className="text-sm font-bold text-slate-500">Clients</p><p className="mt-2 text-3xl font-black">{clients}</p></div>
            <div className="stat-card"><p className="text-sm font-bold text-slate-500">Active</p><p className="mt-2 text-3xl font-black text-emerald-700">{activeClients}</p></div>
            <div className="stat-card"><p className="text-sm font-bold text-slate-500">Archived</p><p className="mt-2 text-3xl font-black text-amber-700">{archivedClients}</p></div>
            <div className="stat-card"><p className="text-sm font-bold text-slate-500">Users</p><p className="mt-2 text-3xl font-black">{users}</p></div>
            <div className="stat-card"><p className="text-sm font-bold text-slate-500">Orders</p><p className="mt-2 text-3xl font-black">{totalOrders}</p></div>
            <div className="stat-card"><p className="text-sm font-bold text-slate-500">Needs Review</p><p className="mt-2 text-3xl font-black text-blue-700">{needsReview}</p></div>
            <div className="stat-card"><p className="text-sm font-bold text-slate-500">Created</p><p className="mt-2 text-3xl font-black text-emerald-700">{created}</p></div>
            <div className="stat-card"><p className="text-sm font-bold text-slate-500">Errors</p><p className="mt-2 text-3xl font-black text-rose-700">{errors}</p></div>
            <div className="stat-card"><p className="text-sm font-bold text-slate-500">Gmail</p><p className="mt-2 text-3xl font-black">{gmail}</p></div>
            <div className="stat-card"><p className="text-sm font-bold text-slate-500">Outlook</p><p className="mt-2 text-3xl font-black">{outlook}</p></div>
            <div className="stat-card"><p className="text-sm font-bold text-slate-500">Feedback</p><p className="mt-2 text-3xl font-black">{feedback}</p></div>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <Link className="card transition hover:border-blue-200 hover:bg-blue-50" href="/admin/clients"><h3 className="text-xl font-black">Clients & Controls</h3><p className="mt-2 text-slate-500">Activation, archive/delete, Gmail/Outlook limits and automation settings.</p></Link>
            <Link className="card transition hover:border-blue-200 hover:bg-blue-50" href="/admin/storage"><h3 className="text-xl font-black">Storage Usage</h3><p className="mt-2 text-slate-500">Open only when needed. This avoids slowing the main dashboard.</p></Link>
            <Link className="card transition hover:border-blue-200 hover:bg-blue-50" href="/admin/logs"><h3 className="text-xl font-black">Logs & Activity</h3><p className="mt-2 text-slate-500">Review operational logs and admin actions.</p></Link>
          </section>

          <section className="card">
            <div className="mb-4 flex items-center justify-between"><h3 className="text-xl font-black">Recent Activity</h3><Link className="text-sm font-bold text-blue-700" href="/admin/activity">View all</Link></div>
            <div className="space-y-2">
              {recentActivity.length === 0 && <p className="text-slate-500">No activity logged yet.</p>}
              {recentActivity.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-bold text-slate-950">{item.action}</p>
                  <p className="text-sm text-slate-500">{item.company?.name || 'No company'} • {item.actorEmail || 'System'} • {item.createdAt.toLocaleString()}</p>
                  {item.message && <p className="mt-1 text-sm text-slate-600">{item.message}</p>}
                </div>
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
