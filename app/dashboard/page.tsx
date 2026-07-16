import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, isPlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export default async function Dashboard() {
  const session = getSession();
  if (!session) redirect('/login');

  const company = await prisma.company.findUnique({ where: { id: session.companyId }, select: { name: true } });

  const [orders, products, customers, learnedProducts, learnedCustomers, recentOrders, needsReview] = await Promise.all([
    prisma.order.count({ where: { companyId: session.companyId } }),
    prisma.product.count({ where: { companyId: session.companyId } }),
    prisma.customer.count({ where: { companyId: session.companyId } }),
    prisma.productAlias.count({ where: { companyId: session.companyId } }),
    prisma.customerAlias.count({ where: { companyId: session.companyId } }),
    prisma.order.findMany({ where: { companyId: session.companyId }, orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.order.count({ where: { companyId: session.companyId, status: { in: ['NEW', 'NEEDS_REVIEW', 'READY', 'ERROR'] } } })
  ]);

  return (
    <main className="page-shell space-y-6">
      <div className="hero-card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="page-title">{company?.name || 'Client'} Dashboard</h1>
          <p className="page-subtitle">NexOrder AI order capture, review, mobile approval, learning and Cin7 automation.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="btn-secondary" href="/mobile">Mobile Review</Link>
          <Link className="btn-secondary" href="/orders">View Orders</Link>
          <Link className="btn" href="/orders/new">Test New Order</Link>
          {isPlatformAdmin(session) && <Link className="btn-secondary" href="/admin">Admin</Link>}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-6">
        <div className="card"><p className="text-sm text-slate-500">Needs Review</p><p className="mt-2 text-4xl font-black">{needsReview}</p></div>
        <div className="card"><p className="text-sm text-slate-500">Orders</p><p className="mt-2 text-4xl font-black">{orders}</p></div>
        <div className="card"><p className="text-sm text-slate-500">Products</p><p className="mt-2 text-4xl font-black">{products}</p></div>
        <div className="card"><p className="text-sm text-slate-500">Customers</p><p className="mt-2 text-4xl font-black">{customers}</p></div>
        <div className="card"><p className="text-sm text-slate-500">Product Learning</p><p className="mt-2 text-4xl font-black">{learnedProducts}</p></div>
        <div className="card"><p className="text-sm text-slate-500">Customer Learning</p><p className="mt-2 text-4xl font-black">{learnedCustomers}</p></div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Link className="card transition hover:-translate-y-0.5 hover:shadow-2xl" href="/mobile">
          <h2 className="text-xl font-black">Mobile Review App</h2>
          <p className="mt-2 text-slate-500">Install NexOrder AI on phone and approve orders from anywhere.</p>
        </Link>
        <Link className="card transition hover:-translate-y-0.5 hover:shadow-2xl" href="/settings"><h2 className="text-xl font-black">Cin7 Connection</h2><p className="mt-2 text-slate-500">Connect once, then refresh product and customer data when required.</p></Link>
        <Link className="card transition hover:-translate-y-0.5 hover:shadow-2xl" href="/orders/new"><h2 className="text-xl font-black">Test Manual Order</h2><p className="mt-2 text-slate-500">Paste an order email and review the mapped customer/products before creating order.</p></Link>
        <Link className="card transition hover:-translate-y-0.5 hover:shadow-2xl" href="/email"><h2 className="text-xl font-black">Input Channels</h2><p className="mt-2 text-slate-500">Manage Outlook, Gmail and WhatsApp order intake channels.</p></Link>
      </div>

      <section className="card">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-black">Recent Orders</h2><Link className="text-sm font-bold text-blue-700 hover:text-blue-900" href="/orders">View all →</Link></div>
        <div className="space-y-2">
          {recentOrders.length === 0 && <p className="text-slate-500">No orders yet.</p>}
          {recentOrders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`} className="flex items-center justify-between rounded-3xl border border-slate-200/70 bg-white/70 p-4 transition hover:bg-white hover:shadow-lg">
              <div><p className="font-black">{order.poNumber || order.subject || 'Order'}</p><p className="text-sm text-slate-500">{order.customerText || 'Customer not found'}</p></div>
              <span className="badge badge-gray">{order.status}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
