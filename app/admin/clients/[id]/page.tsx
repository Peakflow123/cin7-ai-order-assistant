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
      outlook: true,
      gmail: true,
      _count: { select: { products: true, customers: true, orders: true, aliases: true, customerAliases: true } }
    }
  });

  if (!company) return <main className="p-6">Client not found.</main>;

  return (
    <main className="page-shell space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin" className="text-sm font-semibold text-slate-500 hover:text-slate-950">← Back to Clients</Link>
          <h1 className="page-title mt-2">Manage Client: {company.name}</h1>
        </div>
      </div>

      <div className="grid md:grid-cols-5 gap-4">
        <div className="card"><b>Orders</b><p className="text-3xl">{company._count.orders}</p></div>
        <div className="card"><b>Products</b><p className="text-3xl">{company._count.products}</p></div>
        <div className="card"><b>Customers</b><p className="text-3xl">{company._count.customers}</p></div>
        <div className="card"><b>Outlook</b><p className="text-3xl">{company.outlook.length}</p></div>
        <div className="card"><b>Gmail</b><p className="text-3xl">{company.gmail.length}</p></div>
      </div>

      <ClientAdminForm
        companyId={company.id}
        companyName={company.name}
        isActive={company.isActive}
        cin7AccountId={company.cin7?.accountId || ''}
        allowClientCin7Edit={company.allowClientCin7Edit}
        allowClientEmailReconnect={company.allowClientEmailReconnect}
        autoCreateEnabled={company.autoCreateEnabled}
        autoCreateThreshold={company.autoCreateThreshold}
        maxOutlookConnections={company.maxOutlookConnections}
        maxGmailConnections={company.maxGmailConnections}
        maxWhatsappConnections={company.maxWhatsappConnections}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <h2 className="text-xl font-bold mb-3">Outlook Connections</h2>
          <div className="space-y-2">
            {company.outlook.length === 0 && <p className="text-slate-500">No Outlook connections.</p>}
            {company.outlook.map((item) => <p key={item.id} className="rounded-xl bg-slate-50 p-3">{item.email || 'Unknown mailbox'} - {item.isActive ? 'Active' : 'Inactive'}</p>)}
          </div>
        </div>
        <div className="card">
          <h2 className="text-xl font-bold mb-3">Gmail Connections</h2>
          <div className="space-y-2">
            {company.gmail.length === 0 && <p className="text-slate-500">No Gmail connections.</p>}
            {company.gmail.map((item) => <p key={item.id} className="rounded-xl bg-slate-50 p-3">{item.email || 'Unknown mailbox'} - {item.isActive ? 'Active' : 'Inactive'}</p>)}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-bold mb-3">Users</h2>
        <ul className="list-disc ml-6">
          {company.users.map((user) => <li key={user.id}>{user.email} - {user.role}</li>)}
        </ul>
      </div>
    </main>
  );
}
