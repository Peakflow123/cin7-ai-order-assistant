import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, isPlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export default async function AdminActivityPage() {
  const session = getSession();
  if (!session) redirect('/login');
  if (!isPlatformAdmin(session)) redirect('/dashboard');

  const activities = await prisma.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { company: { select: { name: true } } }
  });

  return (
    <main className="page-shell space-y-6">
      <section className="hero-card"><Link href="/admin" className="text-sm font-bold text-blue-700">← Back to Admin</Link><h1 className="page-title mt-2">Activity Monitoring</h1><p className="page-subtitle">Track important admin and system activity across clients.</p></section>
      <section className="card overflow-x-auto">
        <table className="w-full min-w-[1000px] text-left text-sm"><thead className="table-head"><tr><th className="px-4 py-3">Time</th><th className="px-4 py-3">Company</th><th className="px-4 py-3">Actor</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Message</th></tr></thead><tbody>{activities.map((item) => <tr key={item.id} className="table-row"><td className="px-4 py-4">{item.createdAt.toLocaleString()}</td><td className="px-4 py-4">{item.company?.name || '-'}</td><td className="px-4 py-4">{item.actorEmail || '-'}</td><td className="px-4 py-4"><span className="badge badge-gray">{item.action}</span></td><td className="px-4 py-4">{item.message || '-'}</td></tr>)}</tbody></table>
      </section>
    </main>
  );
}
