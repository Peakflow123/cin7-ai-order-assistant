import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, isPlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import SessionTimeoutClient from './SessionTimeoutClient';
import Cin7ConnectionSection from './Cin7ConnectionSection';

function safeDecrypt(value?: string | null) {
  if (!value) return '';
  try {
    return decrypt(value);
  } catch {
    return '';
  }
}

export default async function SettingsPage() {
  const session = getSession();
  if (!session) redirect('/login');
  if (isPlatformAdmin(session)) redirect('/admin');

  const [user, cin7, syncState] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.userId } }),
    prisma.cin7Connection.findUnique({ where: { companyId: session.companyId } }),
    prisma.integrationSyncState.findUnique({ where: { companyId: session.companyId } }).catch(() => null)
  ]);

  if (!user) redirect('/login');

  return (
    <main className="page-shell space-y-6">
      <section className="hero-card">
        <Link href="/dashboard" className="text-sm font-bold text-blue-700">← Back to Dashboard</Link>
        <h1 className="page-title mt-2">Settings</h1>
        <p className="page-subtitle">Manage session security and simple Cin7 Core connection.</p>
      </section>

      <SessionTimeoutClient current={user.sessionTimeoutMinutes} />

      <Cin7ConnectionSection
        hasConnection={Boolean(cin7)}
        accountId={cin7?.accountId || ''}
        apiKey={safeDecrypt(cin7?.apiKeyEncrypted)}
        lastStatus={syncState?.lastSyncStatus || null}
        lastMessage={syncState?.lastSyncMessage || null}
        lastProductsSync={syncState?.productsLastSyncedAt?.toISOString() || null}
        lastCustomersSync={syncState?.customersLastSyncedAt?.toISOString() || null}
      />
    </main>
  );
}
