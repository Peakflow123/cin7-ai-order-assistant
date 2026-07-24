import { redirect } from 'next/navigation';
import { getSession, isPlatformAdmin } from '@/lib/auth';
import { getAdminClients, estimateStorageMb } from '@/lib/admin-control-center';
import AdminPortalShell from '../AdminPortalShell';

function pct(value: any) {
  const n = Number(value ?? 0.95);
  return Math.round(n * 100);
}

export default async function AdminLaunchClients() {
  const session = getSession();
  if (!session) redirect('/login');
  if (!isPlatformAdmin(session)) redirect('/dashboard');
  const clients = await getAdminClients();

  return (
    <AdminPortalShell title="Clients & Controls" subtitle="All client controls from the old admin page are consolidated here: lifecycle, limits, automation, Cin7 edit permissions, usage KPIs and delete controls.">
      <section className="space-y-5">
        {clients.map((client) => (
          <section key={client.id} className="card space-y-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <h2 className="text-2xl font-black">{client.name}</h2>
                <p className="text-sm text-slate-500">Users {client.users} • Products {client.products} • Customers {client.customers} • Orders {client.orders} • Feedback {client.feedbackCount}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={client.isArchived ? 'badge badge-gray' : client.isActive ? 'badge badge-green' : 'badge badge-red'}>{client.isArchived ? 'Archived' : client.isActive ? 'Active' : 'Inactive'}</span>
                <span className="badge badge-blue">{client.planName}</span>
                <span className="badge badge-purple">Storage {estimateStorageMb(client)} MB</span>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-6">
              <div className="soft-panel"><p className="section-label">Gmail</p><p className="text-2xl font-black">{client.gmailConnections}/{client.maxGmailConnections}</p></div>
              <div className="soft-panel"><p className="section-label">Outlook</p><p className="text-2xl font-black">{client.outlookConnections}/{client.maxOutlookConnections}</p></div>
              <div className="soft-panel"><p className="section-label">Needs review</p><p className="text-2xl font-black">{client.needsReview}</p></div>
              <div className="soft-panel"><p className="section-label">Created</p><p className="text-2xl font-black">{client.createdOrders}</p></div>
              <div className="soft-panel"><p className="section-label">Errors</p><p className="text-2xl font-black">{client.errorOrders}</p></div>
              <div className="soft-panel"><p className="section-label">AI feedback</p><p className="text-2xl font-black">{client.feedbackCount}</p></div>
            </div>

            <form className="grid gap-4 md:grid-cols-4 xl:grid-cols-6" action="/api/admin/launch/client-controls" method="post">
              <input type="hidden" name="companyId" value={client.id} />
              <label><span className="section-label">Client status</span><select className="input mt-1" name="isActive" defaultValue={client.isActive ? 'true' : 'false'}><option value="true">Active</option><option value="false">Inactive</option></select></label>
              <label><span className="section-label">Archive</span><select className="input mt-1" name="isArchived" defaultValue={client.isArchived ? 'true' : 'false'}><option value="false">Not archived</option><option value="true">Archived</option></select></label>
              <label><span className="section-label">Plan</span><select className="input mt-1" name="planName" defaultValue={client.planName || 'Starter'}><option>Trial</option><option>Starter</option><option>Professional</option><option>Enterprise</option></select></label>
              <label><span className="section-label">Gmail limit</span><input className="input mt-1" type="number" min="0" name="maxGmailConnections" defaultValue={client.maxGmailConnections || 1} /></label>
              <label><span className="section-label">Outlook limit</span><input className="input mt-1" type="number" min="0" name="maxOutlookConnections" defaultValue={client.maxOutlookConnections || 1} /></label>
              <label><span className="section-label">Monthly orders</span><input className="input mt-1" type="number" min="0" name="monthlyOrderLimit" defaultValue={client.monthlyOrderLimit || ''} placeholder="Optional" /></label>
              <label><span className="section-label">Auto-create Cin7</span><select className="input mt-1" name="autoCreateEnabled" defaultValue={client.autoCreateEnabled ? 'true' : 'false'}><option value="false">Disabled</option><option value="true">Enabled</option></select></label>
              <label><span className="section-label">Confidence threshold %</span><input className="input mt-1" type="number" min="50" max="100" name="autoCreateThresholdPercent" defaultValue={pct(client.autoCreateThreshold)} /></label>
              <label><span className="section-label">Client can edit Cin7</span><select className="input mt-1" name="allowClientEditCin7Settings" defaultValue={client.allowClientEditCin7Settings ? 'true' : 'false'}><option value="false">Locked</option><option value="true">Allowed</option></select></label>
              <label><span className="section-label">Client can reconnect email</span><select className="input mt-1" name="allowClientReconnectEmail" defaultValue={client.allowClientReconnectEmail ? 'true' : 'false'}><option value="true">Allowed</option><option value="false">Locked</option></select></label>
              <label className="md:col-span-4 xl:col-span-2"><span className="section-label">Admin notes</span><input className="input mt-1" name="adminNotes" defaultValue={client.adminNotes || ''} placeholder="Internal note" /></label>
              <div className="md:col-span-4 xl:col-span-6"><button className="btn">Save all controls</button></div>
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
      </section>
    </AdminPortalShell>
  );
}
