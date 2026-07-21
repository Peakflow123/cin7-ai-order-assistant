import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, isPlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export default async function ErrorsPage() {
  const session = getSession();
  if (!session) redirect('/login');
  if (!isPlatformAdmin(session)) redirect('/dashboard');
  const orders = await prisma.order.findMany({ where: { status: 'ERROR' }, orderBy: { createdAt: 'desc' }, take: 100 });
  return <main className="page-shell space-y-6"><section className="hero-card"><Link href="/admin/launch" className="text-sm font-bold text-blue-700">Back</Link><h1 className="page-title mt-2">Error Monitoring</h1></section><section className="card space-y-3">{orders.length === 0 && <p className="text-slate-500">No failed orders.</p>}{orders.map((order) => <Link key={order.id} href={`/orders/${order.id}`} className="block rounded-2xl border border-rose-200 bg-rose-50 p-4"><p className="font-bold text-rose-900">{order.poNumber || order.subject || 'Order error'}</p><p className="text-sm text-rose-800">{order.error}</p></Link>)}</section></main>;
}
