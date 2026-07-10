import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export default async function Dashboard() {
  const session = getSession();
  if (!session) redirect('/login');

  const [orders, products, customers] = await Promise.all([
    prisma.order.count({ where: { companyId: session.companyId } }),
    prisma.product.count({ where: { companyId: session.companyId } }),
    prisma.customer.count({ where: { companyId: session.companyId } })
  ]);

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="card"><b>Orders</b><p className="text-3xl">{orders}</p></div>
        <div className="card"><b>Products</b><p className="text-3xl">{products}</p></div>
        <div className="card"><b>Customers</b><p className="text-3xl">{customers}</p></div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Link className="card hover:bg-slate-50" href="/settings">1. Connect Cin7</Link>
        <Link className="card hover:bg-slate-50" href="/orders/new">2. Test email order</Link>
        <Link className="card hover:bg-slate-50" href="/orders">3. Review Orders</Link>
        <Link className="card hover:bg-slate-50" href="/email">4. Email Connections</Link>
      </div>
    </main>
  );
}
