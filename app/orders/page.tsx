import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

function statusClass(status: string) {
  if (status === 'CREATED') return 'badge badge-green';
  if (status === 'ERROR') return 'badge badge-red';
  if (status === 'NEEDS_REVIEW') return 'badge badge-yellow';
  return 'badge badge-gray';
}

export default async function Orders() {
  const session = getSession();
  if (!session) redirect('/login');

  const orders = await prisma.order.findMany({ where: { companyId: session.companyId }, orderBy: { createdAt: 'desc' }, take: 100 });

  return (
    <main className="page-shell space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Link href="/dashboard" className="text-sm font-semibold text-slate-500 hover:text-slate-950">← Back to Dashboard</Link>
          <h1 className="page-title mt-2">Orders</h1>
          <p className="page-subtitle">Review AI extracted orders and send them to Cin7.</p>
        </div>
        <Link className="btn" href="/orders/new">New Test Order</Link>
      </div>

      <section className="card">
        <div className="space-y-3">
          {orders.length === 0 && <p className="text-slate-500">No orders yet.</p>}
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold text-slate-950">{order.poNumber || order.subject || 'Order'}</p>
                <p className="text-sm text-slate-500">{order.customerText || 'Customer not found'} • {order.source}</p>
              </div>
              <div className="flex items-center gap-2">
                {order.cin7SaleId && <span className="badge badge-green">Cin7 Created</span>}
                <span className={statusClass(order.status)}>{order.status}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
