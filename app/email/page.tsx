import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export default async function InputChannelsPage() {
  const session = getSession();
  if (!session) redirect('/login');

  const [outlook, gmail] = await Promise.all([
    prisma.outlookConnection.findUnique({ where: { companyId: session.companyId } }),
    prisma.gmailConnection.findUnique({ where: { companyId: session.companyId } })
  ]);

  return (
    <main className="page-shell space-y-6">
      <div>
        <Link href="/dashboard" className="text-sm font-semibold text-slate-500 hover:text-slate-950">← Back to Dashboard</Link>
        <h1 className="page-title mt-2">Input Channels</h1>
        <p className="page-subtitle">These are the sources NexOrder AI will use to receive customer orders.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Microsoft Outlook</h2>
            <span className={outlook ? 'badge badge-green' : 'badge badge-yellow'}>{outlook ? 'Connected' : 'Planned'}</span>
          </div>
          <p className="text-slate-600">Connect an Outlook mailbox so NexOrder AI can read incoming customer order emails and create review orders automatically.</p>
          <a className="btn-secondary w-full" href="/api/outlook/connect">Connect Outlook</a>
          <p className="text-xs text-slate-500">Next phase: mailbox folder selection, polling schedule, duplicate email protection, and attachment reading.</p>
        </section>

        <section className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Gmail</h2>
            <span className={gmail ? 'badge badge-green' : 'badge badge-yellow'}>{gmail ? 'Connected' : 'Planned'}</span>
          </div>
          <p className="text-slate-600">Connect a Gmail inbox for customers who receive orders through Google Workspace or Gmail accounts.</p>
          <a className="btn-secondary w-full" href="/api/gmail/connect">Connect Gmail</a>
          <p className="text-xs text-slate-500">Next phase: Gmail label selection, attachment reading, and safe background processing.</p>
        </section>

        <section className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">WhatsApp</h2>
            <span className="badge badge-gray">Coming Soon</span>
          </div>
          <p className="text-slate-600">Prepare WhatsApp order intake for customers who place orders through messages, screenshots, or forwarded text.</p>
          <button className="btn-secondary w-full" disabled>Connect WhatsApp - Coming Soon</button>
          <p className="text-xs text-slate-500">Next phase: WhatsApp Business API setup, phone number verification, webhook, message parsing, and media attachment reading.</p>
        </section>
      </div>

      <section className="card">
        <h2 className="text-xl font-bold">Current Manual Input</h2>
        <p className="mt-2 text-slate-600">Until these channels are fully connected, you can keep testing with manual pasted orders.</p>
        <Link className="btn mt-4" href="/orders/new">Test Manual Order</Link>
      </section>
    </main>
  );
}
