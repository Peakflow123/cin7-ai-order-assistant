import { redirect } from 'next/navigation';
import { getSession, isPlatformAdmin } from '@/lib/auth';
import AdminPortalShell from '../AdminPortalShell';

export default async function Page() {
  const session = getSession();
  if (!session) redirect('/login');
  if (!isPlatformAdmin(session)) redirect('/dashboard');
  return <AdminPortalShell title="Backups & Recovery" subtitle="Operational checklist for launch safety and disaster recovery."><section className="card space-y-4"><h2 className="text-xl font-black">Recommended before onboarding clients</h2><ul className="list-disc space-y-2 pl-6 text-slate-700"><li>Enable Supabase daily backups.</li><li>Create a Git stable tag before every production upgrade.</li><li>Keep Vercel environment variables documented securely.</li><li>Test restore process before larger client onboarding.</li></ul></section></AdminPortalShell>;
}
