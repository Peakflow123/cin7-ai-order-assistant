import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, isPlatformAdmin } from '@/lib/auth';
import { getLaunchSummary } from '@/lib/admin-launch-safe';

function statusBadge(active: boolean, archived: boolean) {
  if (archived) return 'badge badge-gray';
  if (active) return 'badge badge-green';
  return 'badge badge-red';
}

export default async function LaunchControlCenter() {
  const session = getSession();
  if (!session) redirect('/login');
  if (!isPlatformAdmin(session)) redirect('/dashboard');

  const clients = await getLaunchSummary();
  const totals = clients.reduce((acc, c) => ({
    clients: acc.clients + 1,
    orders: acc.orders + Number(c.orders || 0),
    needsReview: acc.needsReview + Number(c.needsReview || 0),
    errors: acc.errors + Number(c.errorOrders || 0)
  }), { clients: 0, orders: 0, needsReview: 0, errors: 0 });

  return (
    <main className="page-shell space-y-6">
      <section className="hero-card">
        <Link href="/admin" className="text-sm font-bold text-blue-700">Back to Admin</Link>
        <h1 className="page-title mt-2">Launch Control Center</h1>
        <p className="page-subtitle">Operational dashboard for onboarding, monitoring, usage and client controls.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link className="btn-secondary" href="/admin/launch/clients">Clients</Link>
          <Link className="btn-secondary" href="/admin/launch/usage">Usage & Storage</Link>
          <Link className="btn-secondary" href="/admin/launch/activity">Activity</Link>
          <Link className="btn-secondary" href="/admin/launch/errors">Errors</Link>
          <Link className="btn-secondary" href="/admin/launch/backups">Backups</Link>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-4">
        <div className="card"><p className="section-label">Clients</p><p className="text-3xl font-black">{totals.clients}</p></div>
        <div className="card"><p className="section-label">Orders</p><p className="text-3xl font-black">{totals.orders}</p></div>
        <div className="card"><p className="section-label">Needs review</p><p className="text-3xl font-black">{totals.needsReview}</p></div>
        <div className="card"><p className="section-label">Errors</p><p className="text-3xl font-black">{totals.errors}</p></div>
      </section>
      <section className="card space-y-3">
        <h2 className="text-xl font-black">Client overview</h2>
        {clients.map((client) => (
          <div key={client.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-black">{client.name}</p>
                  <span className={statusBadge(client.isActive, client.isArchived)}>{client.isArchived ? 'Archived' : client.isActive ? 'Active' : 'Inactive'}</span>
                  <span className="badge badge-blue">{client.planName}</span>
                </div>
                <p className="text-sm text-slate-500">Users: {client.users} • Gmail: {client.gmailConnections} • Outlook: {client.outlookConnections}</p>
              </div>
              <p className="text-sm text-slate-600">Orders: {client.orders} • Review: {client.needsReview} • Errors: {client.errorOrders}</p>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
