import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, isPlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import ClientPortalFrame from '@/components/ClientPortalFrame';

export default async function DashboardPage({ searchParams }: { searchParams?: { from?: string; to?: string } }) {
  const session = getSession();
  if (!session) redirect('/login');
  if (isPlatformAdmin(session)) redirect('/admin');

  const from = searchParams?.from || '';
  const to = searchParams?.to || '';
  const orderDateWhere: any = { companyId: session.companyId };
  if (from || to) {
    orderDateWhere.createdAt = {};
    if (from) orderDateWhere.createdAt.gte = new Date(`${from}T00:00:00.000Z`);
    if (to) orderDateWhere.createdAt.lte = new Date(`${to}T23:59:59.999Z`);
  }

  const [company, orderCount, needsReview, createdOrders, errorOrders, gmailCount, outlookCount, productCount, customerCount, recentOrders] = await Promise.all([
    prisma.company.findUnique({ where: { id: session.companyId } }),
    prisma.order.count({ where: orderDateWhere }),
    prisma.order.count({ where: { ...orderDateWhere, status: 'NEEDS_REVIEW' } }),
    prisma.order.count({ where: { ...orderDateWhere, status: 'CREATED' } }),
    prisma.order.count({ where: { ...orderDateWhere, status: 'ERROR' } }),
    prisma.gmailConnection.count({ where: { companyId: session.companyId, isActive: true } }),
    prisma.outlookConnection.count({ where: { companyId: session.companyId, isActive: true } }),
    prisma.product.count({ where: { companyId: session.companyId } }),
    prisma.customer.count({ where: { companyId: session.companyId } }),
    prisma.order.findMany({ where: { companyId: session.companyId }, orderBy: { createdAt: 'desc' }, take: 6 })
  ]);

  return (
    <ClientPortalFrame companyName={company?.name}>
      <main className="page-shell space-y-6">
        <section className="client-hero">
          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="page-title">{company?.name || 'Dashboard'}</h1>
              <p className="page-subtitle">Monitor order intake, review AI-created orders, and keep Cin7 products and customers ready for accurate matching.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link className="btn-secondary" href="/mobile">Review Orders</Link>
            </div>
          </div>
        </section>

        <section className="card">
          <form className="grid gap-3 md:grid-cols-4" action="/dashboard">
            <label><span className="section-label">From date</span><input className="input mt-1" type="date" name="from" defaultValue={from} /></label>
            <label><span className="section-label">To date</span><input className="input mt-1" type="date" name="to" defaultValue={to} /></label>
            <div className="flex items-end gap-2 md:col-span-2"><button className="btn" type="submit">Apply Date Filter</button><Link className="btn-secondary" href="/dashboard">Clear</Link></div>
          </form>
        </section>

        <section className="client-grid-4">
          <div className="client-kpi"><p className="client-kpi-label">Total orders</p><p className="client-kpi-value">{orderCount}</p><p className="client-kpi-note">Selected date range</p></div>
          <div className="client-kpi"><p className="client-kpi-label">Needs review</p><p className="client-kpi-value">{needsReview}</p><p className="client-kpi-note">Waiting for confirmation</p></div>
          <div className="client-kpi"><p className="client-kpi-label">Created in Cin7</p><p className="client-kpi-value">{createdOrders}</p><p className="client-kpi-note">Successfully pushed orders</p></div>
          <div className="client-kpi"><p className="client-kpi-label">Errors</p><p className="client-kpi-value">{errorOrders}</p><p className="client-kpi-note">Need attention</p></div>
        </section>

        <section className="client-grid-3">
          <Link href="/email" className="client-action-card"><div className="client-action-icon">✉</div><div className="client-action-title">Email Intake</div><div className="client-action-text">Load Gmail and Outlook order emails, then process selected messages.</div></Link>
          <Link href="/orders" className="client-action-card"><div className="client-action-icon">▦</div><div className="client-action-title">Orders</div><div className="client-action-text">Search, filter and open all review orders by mailbox and date.</div></Link>
          <Link href="/settings" className="client-action-card"><div className="client-action-icon">⚙</div><div className="client-action-title">Cin7 & Settings</div><div className="client-action-text">Manage Cin7 connection, sync catalogs and security preferences.</div></Link>
        </section>

        <section className="client-grid-2">
          <div className="card space-y-4">
            <h2 className="text-xl font-black">Connected Data</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="soft-panel"><p className="section-label">Gmail</p><p className="text-2xl font-black">{gmailCount}</p></div>
              <div className="soft-panel"><p className="section-label">Outlook</p><p className="text-2xl font-black">{outlookCount}</p></div>
              <div className="soft-panel"><p className="section-label">Products</p><p className="text-2xl font-black">{productCount}</p></div>
              <div className="soft-panel"><p className="section-label">Customers</p><p className="text-2xl font-black">{customerCount}</p></div>
            </div>
          </div>
          <div className="card space-y-4">
            <div className="flex items-center justify-between"><h2 className="text-xl font-black">Recent Orders</h2><Link className="btn-secondary" href="/orders">View All</Link></div>
            <div className="space-y-3">
              {recentOrders.length === 0 && <p className="text-sm text-slate-500">No orders yet. Load emails to begin.</p>}
              {recentOrders.map((order) => <Link key={order.id} href={`/orders/${order.id}`} className="block rounded-2xl border border-slate-200 bg-white p-3 hover:bg-blue-50"><p className="font-black text-slate-950">{order.poNumber || order.subject || 'Order'}</p><p className="text-sm text-slate-500">{order.status} • {order.createdAt.toLocaleDateString()}</p></Link>)}
            </div>
          </div>
        </section>
      </main>
    </ClientPortalFrame>
  );
}
