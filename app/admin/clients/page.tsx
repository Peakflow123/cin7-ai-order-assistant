import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, isPlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export default async function AdminClientsPage() {
  const session = getSession();
  if (!session) redirect('/login');
  if (!isPlatformAdmin(session)) redirect('/dashboard');

  const companies = await prisma.company.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { users: true, orders: true, gmail: true, outlook: true, products: true, customers: true } } }
  });

  return (
    <main className="page-shell space-y-6">
      <section className="hero-card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Link href="/admin" className="text-sm font-bold text-blue-700">← Back to Admin Dashboard</Link>
          <h1 className="page-title mt-2">Clients</h1>
          <p className="page-subtitle">Compact overview of all client workspaces.</p>
        </div>
      </section>

      <section className="card overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="table-head"><tr><th className="px-4 py-3">Client</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Users</th><th className="px-4 py-3">Orders</th><th className="px-4 py-3">Gmail</th><th className="px-4 py-3">Outlook</th><th className="px-4 py-3">Products</th><th className="px-4 py-3">Customers</th></tr></thead>
          <tbody>
            {companies.map((company) => (
              <tr key={company.id} className="table-row">
                <td className="px-4 py-4 font-black text-slate-950">{company.name}</td>
                <td className="px-4 py-4"><span className={company.isActive ? 'badge badge-green' : 'badge badge-red'}>{company.isActive ? 'Active' : 'Inactive'}</span></td>
                <td className="px-4 py-4">{company._count.users}</td>
                <td className="px-4 py-4">{company._count.orders}</td>
                <td className="px-4 py-4">{company._count.gmail}</td>
                <td className="px-4 py-4">{company._count.outlook}</td>
                <td className="px-4 py-4">{company._count.products}</td>
                <td className="px-4 py-4">{company._count.customers}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
