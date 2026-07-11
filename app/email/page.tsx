import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

function ChannelCard(props: {
  title: string;
  description: string;
  connected: number;
  limit: number;
  href?: string;
  comingSoon?: boolean;
  children?: React.ReactNode;
}) {
  const remaining = Math.max(0, props.limit - props.connected);
  const canConnect = !props.comingSoon && remaining > 0 && props.href;

  return (
    <section className="card space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">{props.title}</h2>
        <span className={props.connected > 0 ? 'badge badge-green' : props.comingSoon ? 'badge badge-gray' : 'badge badge-yellow'}>
          {props.comingSoon ? 'Coming Soon' : `${props.connected}/${props.limit} connected`}
        </span>
      </div>
      <p className="text-slate-600">{props.description}</p>
      {props.children}
      {canConnect ? (
        <a className="btn-secondary w-full" href={props.href}>Connect another {props.title}</a>
      ) : (
        <button className="btn-secondary w-full" disabled>{props.comingSoon ? 'Coming Soon' : 'Connection limit reached'}</button>
      )}
      {!props.comingSoon && <p className="text-xs text-slate-500">Remaining allowed connections: {remaining}</p>}
    </section>
  );
}

export default async function InputChannelsPage() {
  const session = getSession();
  if (!session) redirect('/login');

  const company = await prisma.company.findUnique({ where: { id: session.companyId } });
  if (!company) redirect('/login');

  const [outlook, gmail] = await Promise.all([
    prisma.outlookConnection.findMany({ where: { companyId: session.companyId }, orderBy: { createdAt: 'desc' } }),
    prisma.gmailConnection.findMany({ where: { companyId: session.companyId }, orderBy: { createdAt: 'desc' } })
  ]);

  return (
    <main className="page-shell space-y-6">
      <div>
        <Link href="/dashboard" className="text-sm font-semibold text-slate-500 hover:text-slate-950">← Back to Dashboard</Link>
        <h1 className="page-title mt-2">Input Channels</h1>
        <p className="page-subtitle">Connect one or more mailboxes for NexOrder AI. Limits are controlled by platform admin.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChannelCard
          title="Microsoft Outlook"
          description="Connect Outlook/Microsoft 365 mailboxes so NexOrder AI can later read incoming order emails and attachments."
          connected={outlook.length}
          limit={company.maxOutlookConnections}
          href="/api/outlook/connect"
        >
          <div className="space-y-2">
            {outlook.length === 0 && <p className="text-sm text-slate-500">No Outlook mailbox connected yet.</p>}
            {outlook.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="font-semibold">{item.email || 'Outlook mailbox connected'}</p>
                <p className="text-slate-500">Status: {item.isActive ? 'Active' : 'Inactive'}</p>
              </div>
            ))}
          </div>
        </ChannelCard>

        <ChannelCard
          title="Gmail"
          description="Connect Gmail or Google Workspace mailboxes for customer order intake."
          connected={gmail.length}
          limit={company.maxGmailConnections}
          href="/api/gmail/connect"
        >
          <div className="space-y-2">
            {gmail.length === 0 && <p className="text-sm text-slate-500">No Gmail mailbox connected yet.</p>}
            {gmail.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="font-semibold">{item.email || 'Gmail mailbox connected'}</p>
                <p className="text-slate-500">Status: {item.isActive ? 'Active' : 'Inactive'}</p>
              </div>
            ))}
          </div>
        </ChannelCard>

        <ChannelCard
          title="WhatsApp"
          description="Prepare WhatsApp Business order intake for messages, screenshots, and forwarded order text."
          connected={0}
          limit={company.maxWhatsappConnections}
          comingSoon
        />
      </div>

      <section className="card">
        <h2 className="text-xl font-bold">Manual Input Still Available</h2>
        <p className="mt-2 text-slate-600">Until automated inbox reading is fully enabled, use manual pasted order text for testing.</p>
        <Link className="btn mt-4" href="/orders/new">Test Manual Order</Link>
      </section>
    </main>
  );
}
