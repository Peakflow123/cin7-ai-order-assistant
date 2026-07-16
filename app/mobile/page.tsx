import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import PWAInstallButton from '@/components/PWAInstallButton';

function statusClass(status: string) {
  if (status === 'CREATED') return 'badge badge-green';
  if (status === 'ERROR') return 'badge badge-red';
  if (status === 'NEEDS_REVIEW') return 'badge badge-yellow';
  return 'badge badge-gray';
}

function tabHref(tab: string) {
  return `/mobile?tab=${tab}`;
}

export default async function MobileReviewPage({ searchParams }: { searchParams?: { tab?: string; source?: string; account?: string } }) {
  const session = getSession();
  if (!session) redirect('/login');

  const company = await prisma.company.findUnique({ where: { id: session.companyId }, select: { name: true } });
  const tab = searchParams?.tab || 'needs-review';
  const source = searchParams?.source || '';
  const account = searchParams?.account || '';

  const where: any = { companyId: session.companyId };
  if (tab === 'needs-review') where.status = { in: ['NEW', 'NEEDS_REVIEW', 'READY', 'ERROR'] };
  if (tab === 'created') where.status = 'CREATED';
  if (source) where.source = source;
  if (account) where.sourceAccount = account;

  const [orders, needsReviewCount, createdCount, accounts] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 75,
      include: { _count: { select: { lines: true } } }
    }),
    prisma.order.count({ where: { companyId: session.companyId, status: { in: ['NEW', 'NEEDS_REVIEW', 'READY', 'ERROR'] } } }),
    prisma.order.count({ where: { companyId: session.companyId, status: 'CREATED' } }),
    prisma.order.findMany({
      where: { companyId: session.companyId, sourceAccount: { not: null } },
      select: { source: true, sourceAccount: true },
      distinct: ['sourceAccount']
    })
  ]);

  const sourceOptions = ['gmail', 'outlook', 'whatsapp', 'manual-email'];

  return (
    <main className="page-shell space-y-5 pb-24">
      <section className="hero-card space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="badge badge-blue">PWA Mobile Review</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Approve orders anywhere</h1>
            <p className="page-subtitle">{company?.name || 'Client'} can review AI-captured orders, open corrections, and approve orders from a phone.</p>
          </div>
        </div>
        <PWAInstallButton />
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Link href={tabHref('needs-review')} className={`card p-4 ${tab === 'needs-review' ? 'ring-4 ring-blue-100' : ''}`}>
          <p className="text-sm font-bold text-slate-500">Needs Review</p>
          <p className="mt-2 text-4xl font-black text-slate-950">{needsReviewCount}</p>
        </Link>
        <Link href={tabHref('created')} className={`card p-4 ${tab === 'created' ? 'ring-4 ring-emerald-100' : ''}`}>
          <p className="text-sm font-bold text-slate-500">Created</p>
          <p className="mt-2 text-4xl font-black text-slate-950">{createdCount}</p>
        </Link>
      </section>

      <section className="card space-y-3">
        <form className="grid gap-3" action="/mobile">
          <input type="hidden" name="tab" value={tab} />
          <label>
            <span className="section-label">Channel</span>
            <select className="input mt-1" name="source" defaultValue={source}>
              <option value="">All channels</option>
              {sourceOptions.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label>
            <span className="section-label">Mailbox / Account</span>
            <select className="input mt-1" name="account" defaultValue={account}>
              <option value="">All accounts</option>
              {accounts.filter((item) => item.sourceAccount).map((item) => (
                <option key={item.sourceAccount || ''} value={item.sourceAccount || ''}>{item.sourceAccount} ({item.source})</option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn" type="submit">Filter</button>
            <Link className="btn-secondary" href={`/mobile?tab=${tab}`}>Clear</Link>
          </div>
        </form>
      </section>

      <section className="space-y-3">
        {orders.length === 0 && <div className="card text-slate-500">No orders found for this mobile view.</div>}
        {orders.map((order) => (
          <article key={order.id} className="card space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black text-slate-950">{order.poNumber || order.subject || 'Order'}</p>
                <p className="mt-1 text-sm text-slate-500">{order.customerText || 'Customer not found'}</p>
              </div>
              <span className={statusClass(order.status)}>{order.status}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="soft-panel p-3">
                <p className="font-bold text-slate-500">Source</p>
                <p className="mt-1 truncate font-semibold text-slate-900">{order.source}</p>
              </div>
              <div className="soft-panel p-3">
                <p className="font-bold text-slate-500">Lines</p>
                <p className="mt-1 font-semibold text-slate-900">{order._count.lines}</p>
              </div>
            </div>

            {order.sourceAccount && <p className="text-xs text-slate-500">Account: {order.sourceAccount}</p>}

            <div className="grid grid-cols-2 gap-2">
              <Link className="btn" href={`/orders/${order.id}`}>{order.status === 'CREATED' ? 'View' : 'Review'}</Link>
              <Link className="btn-secondary" href="/orders">All Orders</Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
