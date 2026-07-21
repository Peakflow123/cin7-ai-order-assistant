import { redirect } from 'next/navigation';
import { getSession, isPlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import AdminPortalShell from '../AdminPortalShell';

export default async function Page() {
  const session = getSession();
  if (!session) redirect('/login');
  if (!isPlatformAdmin(session)) redirect('/dashboard');
  const rows = await prisma.$queryRawUnsafe<any[]>(`SELECT al.*, c."name" as "companyName" FROM "ActivityLog" al LEFT JOIN "Company" c ON c."id" = al."companyId" ORDER BY al."createdAt" DESC LIMIT 200`);
  return <AdminPortalShell title="Activity Monitoring" subtitle="Admin action history and operational events."><section className="card space-y-3">{rows.length === 0 && <p className="text-slate-500">No activity logged yet.</p>}{rows.map((row) => <div key={row.id} className="rounded-2xl border border-slate-200 bg-white p-4"><p className="font-bold">{row.message}</p><p className="text-sm text-slate-500">{row.companyName || 'Platform'} • {row.actorEmail || 'System'} • {new Date(row.createdAt).toLocaleString()}</p></div>)}</section></AdminPortalShell>;
}
