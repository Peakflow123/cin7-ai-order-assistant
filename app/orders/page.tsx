import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, isPlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import ClientPortalFrame from '@/components/ClientPortalFrame';
import OrderFilters from '@/components/OrderFilters';

function statusClass(status: string) { if (status === 'CREATED') return 'badge badge-green'; if (status === 'ERROR') return 'badge badge-red'; if (status === 'NEEDS_REVIEW') return 'badge badge-yellow'; return 'badge badge-gray'; }
function channelLabel(source: string) { if (source === 'gmail') return 'Gmail'; if (source === 'outlook') return 'Outlook'; if (source === 'inbound-email') return 'Direct Email'; return source; }

export default async function Orders({ searchParams }: { searchParams?: { source?: string; account?: string; deleted?: string; from?: string; to?: string; q?: string } }) {
  const session = getSession(); if (!session) redirect('/login'); if (isPlatformAdmin(session)) redirect('/admin');
  const source = searchParams?.source || '', account = searchParams?.account || '', from = searchParams?.from || '', to = searchParams?.to || '', q = (searchParams?.q || '').trim();
  const where: any = { companyId: session.companyId };
  if (source) where.source = source; if (account) where.sourceAccount = account;
  if (from || to) { where.createdAt = {}; if (from) where.createdAt.gte = new Date(`${from}T00:00:00.000Z`); if (to) where.createdAt.lte = new Date(`${to}T23:59:59.999Z`); }
  if (q) where.OR = [{ customerText: { contains: q, mode: 'insensitive' } }, { poNumber: { contains: q, mode: 'insensitive' } }, { subject: { contains: q, mode: 'insensitive' } }];

  const [orders, gmail, outlook, companyRows] = await Promise.all([
    prisma.order.findMany({ where, orderBy: { createdAt: 'desc' }, take: 150 }),
    prisma.gmailConnection.findMany({ where: { companyId: session.companyId, isActive: true }, select: { email: true }, orderBy: { createdAt: 'asc' } }),
    prisma.outlookConnection.findMany({ where: { companyId: session.companyId, isActive: true }, select: { email: true }, orderBy: { createdAt: 'asc' } }),
    prisma.$queryRawUnsafe<any[]>(`SELECT "inboundEmailToken", COALESCE("inboundEmailEnabled",TRUE) AS "inboundEmailEnabled" FROM "Company" WHERE "id"=$1 LIMIT 1`, session.companyId)
  ]);
  const inboundDomain = process.env.INBOUND_EMAIL_DOMAIN || 'nexorderai.com';
  const company = companyRows[0];
  const accounts: Array<{ channel: 'gmail' | 'outlook' | 'inbound-email'; email: string }> = [
    ...gmail.filter(x => x.email).map(x => ({ channel: 'gmail' as const, email: x.email as string })),
    ...outlook.filter(x => x.email).map(x => ({ channel: 'outlook' as const, email: x.email as string })),
    ...(company?.inboundEmailEnabled && company?.inboundEmailToken ? [{ channel: 'inbound-email' as const, email: `orders-${company.inboundEmailToken}@${inboundDomain}` }] : [])
  ];

  return <ClientPortalFrame><main className="page-shell space-y-6">
    <section className="client-hero"><div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><Link href="/dashboard" className="text-sm font-bold text-blue-700 hover:text-blue-900">Back to Dashboard</Link><h1 className="page-title mt-2">Orders</h1><p className="page-subtitle">Search and filter Gmail, Outlook and Direct Email orders by customer, reference, channel, mailbox and date.</p></div><Link className="btn" href="/mobile">Review Queue</Link></div></section>
    {searchParams?.deleted === '1' && <div className="card border-emerald-200 bg-emerald-50 text-emerald-800">Order deleted and feedback saved for AI learning.</div>}
    <section className="card space-y-3"><OrderFilters action="/orders" q={q} source={source} account={account} from={from} to={to} accounts={accounts} /></section>
    <section className="card"><div className="space-y-3">{orders.length === 0 && <p className="text-slate-500">No orders matched your search or filters.</p>}{orders.map(order => <Link key={order.id} href={`/orders/${order.id}`} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:bg-blue-50/50 md:flex-row md:items-center md:justify-between"><div><p className="font-black text-slate-950">{order.poNumber || order.subject || 'Order'}</p><p className="text-sm text-slate-500">{order.customerText || 'Customer not found'} • {channelLabel(order.source)}{order.sourceAccount && order.source !== 'inbound-email' ? ` • ${order.sourceAccount}` : ''} • {order.createdAt.toLocaleDateString()}</p></div><div className="flex items-center gap-2">{order.possibleDuplicate && <span className="badge badge-red">Possible duplicate</span>}{order.cin7SaleId && <span className="badge badge-green">Cin7 Created</span>}<span className={statusClass(order.status)}>{order.status}</span></div></Link>)}</div></section>
  </main></ClientPortalFrame>;
}
