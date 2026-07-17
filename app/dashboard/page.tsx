import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, isPlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

function statusClass(status: string) {
  if (status === 'CREATED') return 'badge badge-green';
  if (status === 'ERROR') return 'badge badge-red';
  if (status === 'NEEDS_REVIEW') return 'badge badge-yellow';
  return 'badge badge-gray';
}

export default async function Dashboard() {
  const session = getSession();
  if (!session) redirect('/login');
  if (isPlatformAdmin(session)) redirect('/admin');

  const company = await prisma.company.findUnique({ where: { id: session.companyId }, select: { name: true } });

  const [needsReview, created, errors, gmailCount, outlookCount, recentOrders] = await Promise.all([
    prisma.order.count({ where: { companyId: session.companyId, status: { in: ['NEW', 'NEEDS_REVIEW', 'READY'] } } }),
    prisma.order.count({ where: { companyId: session.companyId, status: 'CREATED' } }),
    prisma.order.count({ where: { companyId: session.companyId, status: 'ERROR' } }),
    prisma.gmailConnection.count({ where: { companyId: session.companyId, isActive: true } }),
    prisma.outlookConnection.count({ where: { companyId: session.companyId, isActive: true } }),
    prisma.order.findMany({ where: { companyId: session.companyId }, orderBy: { createdAt: 'desc' }, take: 8 })
  ]);

  return (
    <main className="page-shell space-y-6">
      <section className="hero-card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="page-title">{company?.name || 'Client'} Workspace</h1>
          <p className="page-subtitle">Review AI-captured Gmail and Outlook orders, approve clean orders, and correct anything that needs attention.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="btn" href="/mobile">Review Orders</Link>
          <Link className="btn-secondary" href="/email">Manage Channels</Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-5">
        <div className="stat-card"><p className="text-sm font-bold text-slate-500">Needs Review</p><p className="mt-2 text-4xl font-black text-blue-700">{needsReview}</p></div>
        <div className="stat-card"><p className="text-sm font-bold text-slate-500">Created</p><p className="mt-2 text-4xl font-black text-emerald-700">{created}</p></div>
        <div className="stat-card"><p className="text-sm font-bold text-slate-500">Errors</p><p className="mt-2 text-4xl font-black text-rose-700">{errors}</p></div>
        <div className="stat-card"><p className="text-sm font-bold text-slate-500">Gmail</p><p className="mt-2 text-4xl font-black">{gmailCount}</p></div>
        <div className="stat-card"><p className="text-sm font-bold text-slate-500">Outlook</p><p className="mt-2 text-4xl font-black">{outlookCount}</p></div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Link className="card transition hover:border-blue-200 hover:bg-blue-50" href="/mobile"><h2 className="text-xl font-black">Mobile Review</h2><p className="mt-2 text-slate-500">Approve and correct orders from phone or desktop.</p></Link>
        <Link className="card transition hover:border-blue-200 hover:bg-blue-50" href="/orders"><h2 className="text-xl font-black">All Orders</h2><p className="mt-2 text-slate-500">Filter by status, Gmail, Outlook, mailbox or source.</p></Link>
        <Link className="card transition hover:border-blue-200 hover:bg-blue-50" href="/settings"><h2 className="text-xl font-black">Cin7 Sync</h2><p className="mt-2 text-slate-500">Manage connection and refresh products/customers.</p></Link>
      </section>

      <section className="card">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-black">Recent Orders</h2><Link className="text-sm font-bold text-blue-700" href="/orders">View all</Link></div>
        <div className="space-y-2">
          {recentOrders.length === 0 && <p className="text-slate-500">No orders yet.</p>}
          {recentOrders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50">
              <div><p className="font-black">{order.poNumber || order.subject || 'Order'}</p><p className="text-sm text-slate-500">{order.customerText || 'Customer not found'} • {order.source}</p></div>
              <span className={statusClass(order.status)}>{order.status}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
