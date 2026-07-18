import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, isPlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Cin7SettingsClient from './Cin7SettingsClient';

export default async function Cin7SettingsPage() {
  const session = getSession();
  if (!session) redirect('/login');
  if (isPlatformAdmin(session)) redirect('/admin');

  const [company, cin7, syncState] = await Promise.all([
    prisma.company.findUnique({ where: { id: session.companyId } }),
    prisma.cin7Connection.findUnique({ where: { companyId: session.companyId } }),
    prisma.integrationSyncState.findUnique({ where: { companyId: session.companyId } }).catch(() => null)
  ]);

  if (!company) redirect('/login');

  if (!company.allowClientCin7Edit) {
    return (
      <main className="page-shell space-y-6">
        <section className="hero-card"><Link href="/settings" className="text-sm font-bold text-blue-700">← Back to Settings</Link><h1 className="page-title mt-2">Cin7 Settings</h1><p className="page-subtitle">Cin7 settings are controlled by the platform admin for this client.</p></section>
        <section className="card border-amber-200 bg-amber-50 text-amber-800">You do not currently have permission to edit or refresh Cin7 settings. Please contact the platform admin.</section>
      </main>
    );
  }

  return (
    <main className="page-shell space-y-6">
      <section className="hero-card"><Link href="/settings" className="text-sm font-bold text-blue-700">← Back to Settings</Link><h1 className="page-title mt-2">Cin7 Settings</h1><p className="page-subtitle">Manage the Cin7 API connection and product/customer refresh.</p></section>
      <Cin7SettingsClient accountId={cin7?.accountId || ''} baseUrl={cin7?.baseUrl || 'https://inventory.dearsystems.com/ExternalApi/v2'} hasConnection={Boolean(cin7)} lastStatus={syncState?.lastSyncStatus || null} lastMessage={syncState?.lastSyncMessage || null} lastProductsSync={syncState?.productsLastSyncedAt?.toISOString() || null} lastCustomersSync={syncState?.customersLastSyncedAt?.toISOString() || null} />
    </main>
  );
}
