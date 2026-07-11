import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, isPlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export default async function AdminPage() {
  const session = getSession();
  if (!session) redirect('/login');
  if (!isPlatformAdmin(session)) redirect('/dashboard');

  const companies = await prisma.company.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      users: true,
      cin7: true,
      _count: {
        select: { products: true, customers: true, orders: true, aliases: true, customerAliases: true }
      }
    }
  });

  return (
    <main className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Platform Admin - Clients</h1>
        <Link className="btn" href="/dashboard">Back to Dashboard</Link>
      </div>

      <div className="space-y-4">
        {companies.map((company) => (
          <div key={company.id} className="card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">{company.name}</h2>
                <p className="text-slate-500 text-sm">Company ID: {company.id}</p>
                <p className="text-slate-500 text-sm">Cin7: {company.cin7 ? 'Connected' : 'Not connected'}</p>
                <p className="text-slate-500 text-sm">Auto-create: {company.autoCreateEnabled ? `Yes, ${company.autoCreateThreshold * 100}%+` : 'No'}</p>
              </div>
              <div className="text-right text-sm">
                <p><b>Users:</b> {company.users.length}</p>
                <p><b>Orders:</b> {company._count.orders}</p>
                <p><b>Products:</b> {company._count.products}</p>
                <p><b>Customers:</b> {company._count.customers}</p>
                <p><b>Product aliases:</b> {company._count.aliases}</p>
                <p><b>Customer aliases:</b> {company._count.customerAliases}</p>
                <Link className="btn inline-block mt-3" href={`/admin/clients/${company.id}`}>Manage Client</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
