import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, isPlatformAdmin } from '@/lib/auth';

export default function BackupsPage() {
  const session = getSession();
  if (!session) redirect('/login');
  if (!isPlatformAdmin(session)) redirect('/dashboard');
  return <main className="page-shell space-y-6"><section className="hero-card"><Link href="/admin/launch" className="text-sm font-bold text-blue-700">Back</Link><h1 className="page-title mt-2">Backups & Recovery</h1></section><section className="card space-y-4"><h2 className="text-xl font-black">Recommended before onboarding clients</h2><ul className="list-disc space-y-2 pl-6 text-slate-700"><li>Enable Supabase daily backups.</li><li>Create a Git stable tag before every production upgrade.</li><li>Keep Vercel environment variables documented securely.</li><li>Test restore process before larger client onboarding.</li></ul></section></main>;
}
