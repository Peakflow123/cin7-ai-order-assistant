import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, isPlatformAdmin } from '@/lib/auth';
import { getClientStorageRows } from '@/lib/admin-launch-safe';

export default async function UsagePage() {
  const session = getSession();
  if (!session) redirect('/login');
  if (!isPlatformAdmin(session)) redirect('/dashboard');
  const rows = await getClientStorageRows();
  return (
    <main className="page-shell space-y-6">
      <section className="hero-card"><Link href="/admin/launch" className="text-sm font-bold text-blue-700">Back</Link><h1 className="page-title mt-2">Usage & Storage</h1><p className="page-subtitle">Approximate per-client storage and volume for pricing decisions.</p></section>
      <section className="card overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="p-3">Client</th><th>Products</th><th>Customers</th><th>Orders</th><th>Lines</th><th>Mailboxes</th><th>Approx MB</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-b"><td className="p-3 font-bold">{row.name}</td><td>{row.products}</td><td>{row.customers}</td><td>{row.orders}</td><td>{row.orderLines}</td><td>{Number(row.gmailConnections) + Number(row.outlookConnections)}</td><td>{row.estimatedMb}</td></tr>)}</tbody></table></section>
    </main>
  );
}
