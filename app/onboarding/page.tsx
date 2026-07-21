import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, isPlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

function StepCard({ done, title, description, href }: { done: boolean; title: string; description: string; href: string }) {
  return <Link href={href} className="block rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:bg-blue-50"><div className="flex items-start gap-3"><span className={done ? 'badge badge-green' : 'badge badge-yellow'}>{done ? 'Done' : 'Next'}</span><div><h2 className="text-lg font-black">{title}</h2><p className="text-sm text-slate-500">{description}</p></div></div></Link>;
}

export default async function OnboardingPage() {
  const session = getSession();
  if (!session) redirect('/login');
  if (isPlatformAdmin(session)) redirect('/admin');
  const [cin7, gmail, outlook, productCount, customerCount, testOrder] = await Promise.all([
    prisma.cin7Connection.findUnique({ where: { companyId: session.companyId } }),
    prisma.gmailConnection.count({ where: { companyId: session.companyId, isActive: true } }),
    prisma.outlookConnection.count({ where: { companyId: session.companyId, isActive: true } }),
    prisma.product.count({ where: { companyId: session.companyId } }),
    prisma.customer.count({ where: { companyId: session.companyId } }),
    prisma.order.findFirst({ where: { companyId: session.companyId }, orderBy: { createdAt: 'desc' }, select: { id: true } })
  ]);
  return <main className="page-shell space-y-6"><section className="hero-card"><h1 className="page-title">Go Live Checklist</h1><p className="page-subtitle">Complete these steps before using NexOrder AI live.</p></section><section className="grid gap-4 md:grid-cols-2"><StepCard done={gmail + outlook > 0} title="1. Connect email inbox" description="Connect Gmail or Outlook." href="/email" /><StepCard done={Boolean(cin7)} title="2. Connect Cin7 Core" description="Add Cin7 Account ID and API Key." href="/settings" /><StepCard done={productCount > 0 && customerCount > 0} title="3. Sync products and customers" description={`Products: ${productCount}. Customers: ${customerCount}.`} href="/settings" /><StepCard done={Boolean(testOrder)} title="4. Process a test order" description="Load an email and create a review order." href="/email" /></section></main>;
}
