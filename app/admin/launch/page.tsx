import { redirect } from 'next/navigation';
import { getSession, isPlatformAdmin } from '@/lib/auth';
import { getAdminClients } from '@/lib/admin-control-center';
import AdminPortalShell from './AdminPortalShell';

export default async function AdminLaunchOverview() {
  const session = getSession();
  if (!session) redirect('/login');
  if (!isPlatformAdmin(session)) redirect('/dashboard');
  const clients = await getAdminClients();
  const totals = clients.reduce((a, c) => ({
    clients: a.clients + 1,
    active: a.active + (c.isActive && !c.isArchived ? 1 : 0),
    orders: a.orders + Number(c.orders || 0),
    review: a.review + Number(c.needsReview || 0),
    errors: a.errors + Number(c.errorOrders || 0),
    feedback: a.feedback + Number(c.feedbackCount || 0)
  }), { clients: 0, active: 0, orders: 0, review: 0, errors: 0, feedback: 0 });

  return (
    <AdminPortalShell title="Overview" subtitle="Complete admin command center for launch operations and client control.">
      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <div className="card"><p className="section-label">Clients</p><p className="text-3xl font-black">{totals.clients}</p></div>
        <div className="card"><p className="section-label">Active</p><p className="text-3xl font-black">{totals.active}</p></div>
        <div className="card"><p className="section-label">Orders</p><p className="text-3xl font-black">{totals.orders}</p></div>
        <div className="card"><p className="section-label">Needs Review</p><p className="text-3xl font-black">{totals.review}</p></div>
        <div className="card"><p className="section-label">Errors</p><p className="text-3xl font-black">{totals.errors}</p></div>
        <div className="card"><p className="section-label">Feedback</p><p className="text-3xl font-black">{totals.feedback}</p></div>
      </section>
      <section className="card space-y-3">
        <h2 className="text-xl font-black">Client health snapshot</h2>
        {clients.map((client) => <div key={client.id} className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"><div><p className="text-lg font-black">{client.name}</p><p className="text-sm text-slate-500">Products {client.products} • Customers {client.customers} • Orders {client.orders} • Feedback {client.feedbackCount}</p></div><div className="flex flex-wrap gap-2"><span className={client.isArchived ? 'badge badge-gray' : client.isActive ? 'badge badge-green' : 'badge badge-red'}>{client.isArchived ? 'Archived' : client.isActive ? 'Active' : 'Inactive'}</span><span className="badge badge-blue">{client.planName}</span></div></div></div>)}
      </section>
    </AdminPortalShell>
  );
}
