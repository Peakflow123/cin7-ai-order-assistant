import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export default async function Orders() {
  const session = getSession();
  if (!session) redirect('/login');

  const orders = await prisma.order.findMany({
    where: { companyId: session.companyId },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Orders</h1>
      <div className="space-y-3">
        {orders.map((order) => (
          <Link key={order.id} href={`/orders/${order.id}`} className="card block hover:bg-slate-50">
            <b>{order.subject || order.poNumber || 'Order'}</b>
            <p>{order.sender || 'Manual email'} - {order.status}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
