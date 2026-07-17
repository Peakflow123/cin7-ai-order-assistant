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

function channelLabel(source: string) {
  if (source === 'gmail') return 'Gmail';
  if (source === 'outlook') return 'Outlook';
  return source;
}

export default async function Orders({ searchParams }: { searchParams?: { source?: string; account?: string; deleted?: string } }) {
  const session = getSession();
  if (!session) redirect('/login');
  if (isPlatformAdmin(session)) redirect('/admin');

  const source = searchParams?.source || '';
  const account = searchParams?.account || '';
  const where: any = { companyId: session.companyId };
  if (source) where.source = source;
  if (account) where.sourceAccount = account;

  const [orders, accounts] = await Promise.all([
    prisma.order.findMany({ where, orderBy: { createdAt: 'desc' }, take: 150 }),
    prisma.order.findMany({ where: { companyId: session.companyId, source: { in: ['gmail', 'outlook'] }, sourceAccount: { not: null } }, select: { source: true, sourceAccount: true }, distinct: ['sourceAccount'] })
  ]);

  const sourceOptions = [
    { value: 'gmail', label: 'Gmail' },
    { value: 'outlook', label: 'Outlook' }
  ];

  return (
    <main className="page-shell space-y-6">
      <section className="hero-card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div><Link href="/dashboard" className="text-sm font-bold text-blue-700 hover:text-blue-900">← Back to Dashboard</Link><h1 className="page-title mt-2">Orders</h1><p className="page-subtitle">Review Gmail and Outlook orders. WhatsApp and manual-order filters are hidden while those channels are disabled.</p></div>
        <Link className="btn" href="/mobile">Review Queue</Link>
      </section>

      {searchParams?.deleted === '1' && <div className="card border-emerald-200 bg-emerald-50 text-emerald-800">Order deleted and feedback saved for AI learning.</div>}

      <section className="card">
        <form className="grid gap-3 md:grid-cols-3" action="/orders">
          <label><span className="section-label">Channel</span><select className="input mt-1" name="source" defaultValue={source}><option value="">All channels</option>{sourceOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
          <label><span className="section-label">Account / Mailbox</span><select className="input mt-1" name="account" defaultValue={account}><option value="">All accounts</option>{accounts.filter((item) => item.sourceAccount).map((item) => <option key={item.sourceAccount || ''} value={item.sourceAccount || ''}>{item.sourceAccount} ({channelLabel(item.source)})</option>)}</select></label>
          <div className="flex items-end gap-2"><button className="btn" type="submit">Apply Filters</button><Link className="btn-secondary" href="/orders">Clear</Link></div>
        </form>
      </section>

      <section className="card">
        <div className="space-y-3">
          {orders.length === 0 && <p className="text-slate-500">No orders matched the selected filters.</p>}
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:bg-blue-50/50 md:flex-row md:items-center md:justify-between">
              <div><p className="font-black text-slate-950">{order.poNumber || order.subject || 'Order'}</p><p className="text-sm text-slate-500">{order.customerText || 'Customer not found'} • {channelLabel(order.source)}{order.sourceAccount ? ` • ${order.sourceAccount}` : ''}</p></div>
              <div className="flex items-center gap-2">{order.cin7SaleId && <span className="badge badge-green">Cin7 Created</span>}<span className={statusClass(order.status)}>{order.status}</span></div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
