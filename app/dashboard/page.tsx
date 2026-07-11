import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, isPlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export default async function Dashboard() {
  const session = getSession();
  if (!session) redirect('/login');

  const [orders, products, customers, learnedProducts, learnedCustomers, recentOrders] = await Promise.all([
    prisma.order.count({ where: { companyId: session.companyId } }),
    prisma.product.count({ where: { companyId: session.companyId } }),
    prisma.customer.count({ where: { companyId: session.companyId } }),
    prisma.productAlias.count({ where: { companyId: session.companyId } }),
    prisma.customerAlias.count({ where: { companyId: session.companyId } }),
    prisma.order.findMany({ where: { companyId: session.companyId }, orderBy: { createdAt: 'desc' }, take: 5 })
  ]);

  return (
    <main className="page-shell space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Manage AI order capture, Cin7 sync, and review workflow.</p>
        </div>
        <div className="flex gap-2">
          <Link className="btn-secondary" href="/orders">View Orders</Link>
          <Link className="btn" href="/orders/new">Test New Order</Link>
          {isPlatformAdmin(session) && <Link className="btn-secondary" href="/admin">Admin</Link>}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <div className="card"><p className="text-sm text-slate-500">Orders</p><p className="mt-2 text-4xl font-bold">{orders}</p></div>
        <div className="card"><p className="text-sm text-slate-500">Products</p><p className="mt-2 text-4xl font-bold">{products}</p></div>
        <div className="card"><p className="text-sm text-slate-500">Customers</p><p className="mt-2 text-4xl font-bold">{customers}</p></div>
        <div className="card"><p className="text-sm text-slate-500">Product Learning</p><p className="mt-2 text-4xl font-bold">{learnedProducts}</p></div>
        <div className="card"><p className="text-sm text-slate-500">Customer Learning</p><p className="mt-2 text-4xl font-bold">{learnedCustomers}</p></div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link className="card transition hover:-translate-y-0.5 hover:shadow-md" href="/settings"><h2 className="text-xl font-bold">Cin7 Connection</h2><p className="mt-2 text-slate-500">Connect once, then refresh product and customer data.</p></Link>
        <Link className="card transition hover:-translate-y-0.5 hover:shadow-md" href="/orders/new"><h2 className="text-xl font-bold">Test Email Order</h2><p className="mt-2 text-slate-500">Paste an order email and let AI extract customer, products, and quantities.</p></Link>
      </div>

      <section className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Recent Orders</h2>
          <Link className="text-sm font-semibold text-slate-600 hover:text-slate-950" href="/orders">View all →</Link>
        </div>
        <div className="space-y-2">
          {recentOrders.length === 0 && <p className="text-slate-500">No orders yet.</p>}
          {recentOrders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50">
              <div>
                <p className="font-semibold">{order.poNumber || order.subject || 'Order'}</p>
                <p className="text-sm text-slate-500">{order.customerText || 'Customer not found'}</p>
              </div>
              <span className="badge badge-gray">{order.status}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
