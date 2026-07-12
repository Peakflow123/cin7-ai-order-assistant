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

export default async function Orders({ searchParams }: { searchParams?: { source?: string; account?: string; deleted?: string } }) {
  const session = getSession();
  if (!session) redirect('/login');

  const source = searchParams?.source || '';
  const account = searchParams?.account || '';
  const where: any = { companyId: session.companyId };
  if (source) where.source = source;
  if (account) where.sourceAccount = account;

  const [orders, accounts] = await Promise.all([
    prisma.order.findMany({ where, orderBy: { createdAt: 'desc' }, take: 150 }),
    prisma.order.findMany({ where: { companyId: session.companyId, sourceAccount: { not: null } }, select: { source: true, sourceAccount: true }, distinct: ['sourceAccount'] })
  ]);

  const sourceOptions = ['manual-email', 'gmail', 'outlook', 'whatsapp'];

  return (
    <main className="page-shell space-y-6">
      <div className="hero-card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div><Link href="/dashboard" className="text-sm font-bold text-blue-700 hover:text-blue-900">← Back to Dashboard</Link><h1 className="page-title mt-2">Orders</h1><p className="page-subtitle">Review, filter, correct, delete, or create orders in Cin7.</p></div>
        <Link className="btn" href="/orders/new">New Test Order</Link>
      </div>

      {searchParams?.deleted === '1' && <div className="card border-emerald-200 bg-emerald-50 text-emerald-800">Order deleted and feedback saved for AI learning.</div>}

      <section className="card">
        <form className="grid gap-3 md:grid-cols-3" action="/orders">
          <label><span className="section-label">Channel</span><select className="input mt-1" name="source" defaultValue={source}><option value="">All channels</option>{sourceOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label><span className="section-label">Account / Mailbox</span><select className="input mt-1" name="account" defaultValue={account}><option value="">All accounts</option>{accounts.filter((item) => item.sourceAccount).map((item) => <option key={item.sourceAccount || ''} value={item.sourceAccount || ''}>{item.sourceAccount} ({item.source})</option>)}</select></label>
          <div className="flex items-end gap-2"><button className="btn" type="submit">Apply Filters</button><Link className="btn-secondary" href="/orders">Clear</Link></div>
        </form>
      </section>

      <section className="card">
        <div className="space-y-3">
          {orders.length === 0 && <p className="text-slate-500">No orders matched the selected filters.</p>}
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`} className="flex flex-col gap-3 rounded-3xl border border-slate-200/70 bg-white/70 p-5 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg md:flex-row md:items-center md:justify-between">
              <div><p className="font-black text-slate-950">{order.poNumber || order.subject || 'Order'}</p><p className="text-sm text-slate-500">{order.customerText || 'Customer not found'} • {order.source}{order.sourceAccount ? ` • ${order.sourceAccount}` : ''}</p></div>
              <div className="flex items-center gap-2">{order.cin7SaleId && <span className="badge badge-green">Cin7 Created</span>}<span className={statusClass(order.status)}>{order.status}</span></div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
