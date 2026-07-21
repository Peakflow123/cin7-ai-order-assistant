import { redirect } from 'next/navigation';
import { getSession, isPlatformAdmin } from '@/lib/auth';
import { getClientStorageRows } from '@/lib/admin-launch-safe';
import AdminPortalShell from '../AdminPortalShell';

export default async function UsagePage() {
  const session = getSession();
  if (!session) redirect('/login');
  if (!isPlatformAdmin(session)) redirect('/dashboard');
  const rows = await getClientStorageRows();
  return (
    <AdminPortalShell title="Usage & Storage" subtitle="Approximate per-client usage to support pricing, capacity planning and support decisions.">
      <section className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b"><th className="p-3">Client</th><th>Products</th><th>Customers</th><th>Orders</th><th>Lines</th><th>Mailboxes</th><th>Approx MB</th></tr></thead>
          <tbody>{rows.map((row) => <tr key={row.id} className="border-b"><td className="p-3 font-bold">{row.name}</td><td>{row.products}</td><td>{row.customers}</td><td>{row.orders}</td><td>{row.orderLines}</td><td>{Number(row.gmailConnections) + Number(row.outlookConnections)}</td><td>{row.estimatedMb}</td></tr>)}</tbody>
        </table>
      </section>
    </AdminPortalShell>
  );
}
