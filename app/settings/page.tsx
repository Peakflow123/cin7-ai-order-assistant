import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, isPlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import SessionTimeoutClient from './SessionTimeoutClient';

export default async function SettingsPage() {
  const session = getSession();
  if (!session) redirect('/login');
  if (isPlatformAdmin(session)) redirect('/admin');

  const [company, user, cin7] = await Promise.all([
    prisma.company.findUnique({ where: { id: session.companyId } }),
    prisma.user.findUnique({ where: { id: session.userId } }),
    prisma.cin7Connection.findUnique({ where: { companyId: session.companyId } })
  ]);

  if (!company || !user) redirect('/login');

  return (
    <main className="page-shell space-y-6">
      <section className="hero-card">
        <Link href="/dashboard" className="text-sm font-bold text-blue-700">← Back to Dashboard</Link>
        <h1 className="page-title mt-2">Settings</h1>
        <p className="page-subtitle">Manage session security and Cin7 connection settings.</p>
      </section>

      <SessionTimeoutClient current={user.sessionTimeoutMinutes} />

      <section className="card space-y-4">
        <div>
          <h2 className="text-xl font-black">Cin7 Connection</h2>
          <p className="page-subtitle">Cin7 setup remains controlled based on admin permissions.</p>
        </div>
        <div className="soft-panel">
          <p className="font-bold">Status: {cin7 ? 'Connected' : 'Not connected'}</p>
          <p className="mt-1 text-sm text-slate-500">Client edit allowed: {company.allowClientCin7Edit ? 'Yes' : 'No'}</p>
        </div>
        <Link className="btn-secondary w-full md:w-auto" href="/settings/cin7">Open Cin7 Settings</Link>
      </section>
    </main>
  );
}
