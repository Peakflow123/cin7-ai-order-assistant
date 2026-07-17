import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, isPlatformAdmin } from '@/lib/auth';
import { getAllCompanyUsage, formatBytes } from '@/lib/admin-metrics';
import AdminNav from '../AdminNav';

export default async function AdminStoragePage() {
  const session = getSession();
  if (!session) redirect('/login');
  if (!isPlatformAdmin(session)) redirect('/dashboard');

  const usageRows = await getAllCompanyUsage();
  const totalBytes = usageRows.reduce((sum, row) => sum + row.usage.estimatedBytes, 0);

  return (
    <main className="page-shell">
      <div className="admin-shell">
        <AdminNav active="/admin/storage" />
        <section className="space-y-6 min-w-0">
          <section className="hero-card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <Link href="/admin" className="text-sm font-bold text-blue-700">← Back to Overview</Link>
              <h1 className="page-title mt-2">Storage Usage</h1>
              <p className="page-subtitle">Estimated client storage. This page performs detailed count queries, so it is separated from the fast admin overview.</p>
            </div>
            <div className="stat-card min-w-[180px]"><p className="text-sm font-bold text-slate-500">Estimated Total</p><p className="mt-2 text-3xl font-black text-blue-700">{formatBytes(totalBytes)}</p></div>
          </section>

          <section className="card overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="table-head"><tr><th className="px-4 py-3">Client</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Storage</th><th className="px-4 py-3">Products</th><th className="px-4 py-3">Customers</th><th className="px-4 py-3">Orders</th><th className="px-4 py-3">Lines</th><th className="px-4 py-3">Feedback</th><th className="px-4 py-3">Activity</th><th className="px-4 py-3">Logs</th></tr></thead>
              <tbody>{usageRows.map(({ company, usage }) => <tr key={company.id} className="table-row"><td className="px-4 py-4 font-black">{company.name}</td><td className="px-4 py-4"><span className={company.isArchived ? 'badge badge-yellow' : company.isActive ? 'badge badge-green' : 'badge badge-red'}>{company.isArchived ? 'Archived' : company.isActive ? 'Active' : 'Inactive'}</span></td><td className="px-4 py-4 font-black text-blue-700">{usage.estimatedStorage}</td><td className="px-4 py-4">{usage.products}</td><td className="px-4 py-4">{usage.customers}</td><td className="px-4 py-4">{usage.orders}</td><td className="px-4 py-4">{usage.orderLines}</td><td className="px-4 py-4">{usage.feedback}</td><td className="px-4 py-4">{usage.activity}</td><td className="px-4 py-4">{usage.logs}</td></tr>)}</tbody>
            </table>
          </section>
        </section>
      </div>
    </main>
  );
}
