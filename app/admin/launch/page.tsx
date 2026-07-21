import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, isPlatformAdmin } from '@/lib/auth';
import { getLaunchSummary } from '@/lib/admin-launch-safe';
import AdminPortalShell from './AdminPortalShell';

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
    errors: acc.errors + Number(c.errorOrders || 0),
    gmail: acc.gmail + Number(c.gmailConnections || 0),
    outlook: acc.outlook + Number(c.outlookConnections || 0)
  }), { clients: 0, orders: 0, needsReview: 0, errors: 0, gmail: 0, outlook: 0 });

  return (
    <AdminPortalShell title="Launch Control Center" subtitle="A single command center for client control, usage, monitoring, errors and launch readiness.">
      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <div className="card"><p className="section-label">Clients</p><p className="text-3xl font-black">{totals.clients}</p></div>
        <div className="card"><p className="section-label">Orders</p><p className="text-3xl font-black">{totals.orders}</p></div>
        <div className="card"><p className="section-label">Needs Review</p><p className="text-3xl font-black">{totals.needsReview}</p></div>
        <div className="card"><p className="section-label">Errors</p><p className="text-3xl font-black">{totals.errors}</p></div>
        <div className="card"><p className="section-label">Gmail</p><p className="text-3xl font-black">{totals.gmail}</p></div>
        <div className="card"><p className="section-label">Outlook</p><p className="text-3xl font-black">{totals.outlook}</p></div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Link className="card transition hover:border-blue-200 hover:bg-blue-50" href="/admin/launch/clients"><h2 className="text-xl font-black">Clients & Controls</h2><p className="mt-2 text-slate-500">Activate, archive, set plan limits and delete test clients.</p></Link>
        <Link className="card transition hover:border-blue-200 hover:bg-blue-50" href="/admin/launch/usage"><h2 className="text-xl font-black">Usage & Storage</h2><p className="mt-2 text-slate-500">Track approximate database usage per customer.</p></Link>
        <Link className="card transition hover:border-blue-200 hover:bg-blue-50" href="/admin/launch/errors"><h2 className="text-xl font-black">Error Monitoring</h2><p className="mt-2 text-slate-500">Review failed orders and operational issues.</p></Link>
      </section>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black">Client Snapshot</h2>
          <Link className="btn-secondary" href="/admin/launch/clients">Manage All</Link>
        </div>
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
    </AdminPortalShell>
  );
}
