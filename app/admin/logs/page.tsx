import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, isPlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export default async function AdminLogsPage({ searchParams }: { searchParams?: { level?: string } }) {
  const session = getSession();
  if (!session) redirect('/login');
  if (!isPlatformAdmin(session)) redirect('/dashboard');

  const level = searchParams?.level || '';
  const where: any = {};
  if (level) where.level = level;

  const logs = await prisma.systemLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { company: { select: { name: true } } }
  }).catch(() => []);

  return (
    <main className="page-shell space-y-6">
      <section className="hero-card"><Link href="/admin" className="text-sm font-bold text-blue-700">← Back to Admin</Link><h1 className="page-title mt-2">System Logs</h1><p className="page-subtitle">Application-level stored logs. Kept limited to avoid unnecessary storage growth.</p></section>
      <section className="card"><form className="flex flex-col gap-3 md:flex-row" action="/admin/logs"><select className="input md:max-w-xs" name="level" defaultValue={level}><option value="">All levels</option><option value="INFO">INFO</option><option value="WARNING">WARNING</option><option value="ERROR">ERROR</option></select><button className="btn" type="submit">Filter</button><Link className="btn-secondary" href="/admin/logs">Clear</Link></form></section>
      <section className="card overflow-x-auto">
        <table className="w-full min-w-[1000px] text-left text-sm"><thead className="table-head"><tr><th className="px-4 py-3">Time</th><th className="px-4 py-3">Company</th><th className="px-4 py-3">Level</th><th className="px-4 py-3">Source</th><th className="px-4 py-3">Message</th></tr></thead><tbody>{logs.map((item) => <tr key={item.id} className="table-row"><td className="px-4 py-4">{item.createdAt.toLocaleString()}</td><td className="px-4 py-4">{item.company?.name || '-'}</td><td className="px-4 py-4"><span className={item.level === 'ERROR' ? 'badge badge-red' : item.level === 'WARNING' ? 'badge badge-yellow' : 'badge badge-gray'}>{item.level}</span></td><td className="px-4 py-4">{item.source || '-'}</td><td className="px-4 py-4">{item.message}</td></tr>)}</tbody></table>
      </section>
    </main>
  );
}
