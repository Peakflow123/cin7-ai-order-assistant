import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, isPlatformAdmin } from '@/lib/auth';
import { getLaunchSummary } from '@/lib/admin-launch-safe';

export default async function LaunchClientsPage() {
  const session = getSession();
  if (!session) redirect('/login');
  if (!isPlatformAdmin(session)) redirect('/dashboard');
  const clients = await getLaunchSummary();

  return (
    <main className="page-shell space-y-6">
      <section className="hero-card"><Link href="/admin/launch" className="text-sm font-bold text-blue-700">Back</Link><h1 className="page-title mt-2">Clients & Controls</h1><p className="page-subtitle">Manage status, archive, plans and connection limits. Impersonation is intentionally not included in this safe pack.</p></section>
      {clients.map((client) => (
        <section key={client.id} className="card space-y-4">
          <div><h2 className="text-xl font-black">{client.name}</h2><p className="text-sm text-slate-500">Orders: {client.orders} • Needs review: {client.needsReview} • Errors: {client.errorOrders}</p></div>
          <form className="grid gap-3 md:grid-cols-6" action="/api/admin/launch/client-controls" method="post">
            <input type="hidden" name="companyId" value={client.id} />
            <label><span className="section-label">Active</span><select className="input mt-1" name="isActive" defaultValue={client.isActive ? 'true' : 'false'}><option value="true">Active</option><option value="false">Inactive</option></select></label>
            <label><span className="section-label">Archived</span><select className="input mt-1" name="isArchived" defaultValue={client.isArchived ? 'true' : 'false'}><option value="false">No</option><option value="true">Yes</option></select></label>
            <label><span className="section-label">Plan</span><select className="input mt-1" name="planName" defaultValue={client.planName || 'Starter'}><option>Trial</option><option>Starter</option><option>Professional</option><option>Enterprise</option></select></label>
            <label><span className="section-label">Gmail limit</span><input className="input mt-1" type="number" name="maxGmailConnections" defaultValue={client.maxGmailConnections || 1} /></label>
            <label><span className="section-label">Outlook limit</span><input className="input mt-1" type="number" name="maxOutlookConnections" defaultValue={client.maxOutlookConnections || 1} /></label>
            <label><span className="section-label">Monthly orders</span><input className="input mt-1" type="number" name="monthlyOrderLimit" placeholder="Optional" /></label>
            <div className="md:col-span-6"><button className="btn">Save controls</button></div>
          </form>
          <details className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <summary className="cursor-pointer font-bold text-rose-800">Permanent delete client</summary>
            <form className="mt-4 grid gap-3 md:grid-cols-3" action="/api/admin/launch/delete-client" method="post">
              <input type="hidden" name="companyId" value={client.id} />
              <label className="md:col-span-2"><span className="section-label">Type DELETE to confirm</span><input className="input mt-1" name="confirm" placeholder="DELETE" /></label>
              <div className="flex items-end"><button className="btn-danger">Delete permanently</button></div>
            </form>
          </details>
        </section>
      ))}
    </main>
  );
}
