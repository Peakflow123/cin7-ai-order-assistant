import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, isPlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import ClientAdminForm from './ClientAdminForm';

export default async function ClientAdminPage({ params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) redirect('/login');
  if (!isPlatformAdmin(session)) redirect('/dashboard');

  const company = await prisma.company.findUnique({
    where: { id: params.id },
    include: {
      cin7: true,
      users: true,
      _count: { select: { products: true, customers: true, orders: true, aliases: true, customerAliases: true } }
    }
  });

  if (!company) return <main className="p-6">Client not found.</main>;

  return (
    <main className="p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Manage Client: {company.name}</h1>
        <Link className="btn" href="/admin">Back to Clients</Link>
      </div>

      <div className="grid md:grid-cols-5 gap-4">
        <div className="card"><b>Orders</b><p className="text-3xl">{company._count.orders}</p></div>
        <div className="card"><b>Products</b><p className="text-3xl">{company._count.products}</p></div>
        <div className="card"><b>Customers</b><p className="text-3xl">{company._count.customers}</p></div>
        <div className="card"><b>Product Learn</b><p className="text-3xl">{company._count.aliases}</p></div>
        <div className="card"><b>Customer Learn</b><p className="text-3xl">{company._count.customerAliases}</p></div>
      </div>

      <ClientAdminForm
        companyId={company.id}
        companyName={company.name}
        cin7AccountId={company.cin7?.accountId || ''}
        allowClientCin7Edit={company.allowClientCin7Edit}
        autoCreateEnabled={company.autoCreateEnabled}
        autoCreateThreshold={company.autoCreateThreshold}
      />

      <div className="card">
        <h2 className="text-xl font-bold mb-3">Users</h2>
        <ul className="list-disc ml-6">
          {company.users.map((user) => <li key={user.id}>{user.email} - {user.role}</li>)}
        </ul>
      </div>
    </main>
  );
}
