import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, isPlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import GmailInboxClient from './GmailInboxClient';
import OutlookInboxClient from './OutlookInboxClient';
import ClientPortalFrame from '@/components/ClientPortalFrame';

function ChannelCard(props: { title: string; description: string; connected: number; limit: number; href?: string; children?: React.ReactNode }) {
  const remaining = Math.max(0, props.limit - props.connected);
  const canConnect = remaining > 0 && props.href;
  return (
    <section className="card space-y-4">
      <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-black">{props.title}</h2><span className={props.connected > 0 ? 'badge badge-green' : 'badge badge-yellow'}>{props.connected}/{props.limit}</span></div>
      <p className="text-sm text-slate-500">{props.description}</p>
      {props.children}
      {canConnect ? <a className="btn-secondary w-full" href={props.href}>Connect {props.title}</a> : <button className="btn-secondary w-full" disabled>Connection limit reached</button>}
    </section>
  );
}

export default async function InputChannelsPage() {
  const session = getSession();
  if (!session) redirect('/login');
  if (isPlatformAdmin(session)) redirect('/admin');

  const company = await prisma.company.findUnique({ where: { id: session.companyId } });
  if (!company) redirect('/login');

  const [outlook, gmail] = await Promise.all([
    prisma.outlookConnection.findMany({ where: { companyId: session.companyId }, orderBy: { createdAt: 'desc' } }),
    prisma.gmailConnection.findMany({ where: { companyId: session.companyId }, orderBy: { createdAt: 'desc' } })
  ]);

  return (
    <ClientPortalFrame>
      <main className="page-shell space-y-6">
        <section className="client-hero">
          <div className="relative z-10">
            <Link href="/dashboard" className="text-sm font-bold text-blue-700 hover:text-blue-900">Back to Dashboard</Link>
            <h1 className="page-title mt-2">Email Intake</h1>
            <p className="page-subtitle">Connect Gmail and Outlook mailboxes, load recent emails, and process selected customer orders.</p>
          </div>
        </section>

        <section className="client-grid-2">
          <ChannelCard title="Outlook" description="Microsoft 365 or personal Outlook mailboxes for order emails and attachments." connected={outlook.length} limit={company.maxOutlookConnections} href="/api/outlook/connect">
            <div className="space-y-2">{outlook.length === 0 && <p className="text-sm text-slate-500">No Outlook mailbox connected yet.</p>}{outlook.map((item) => <div key={item.id} className="soft-panel text-sm"><p className="font-semibold">{item.email || 'Outlook mailbox connected'}</p><p className="text-slate-500">{item.isActive ? 'Active' : 'Inactive'}{item.lastCheckedAt ? ` • Last checked ${item.lastCheckedAt.toLocaleString()}` : ''}</p></div>)}</div>
          </ChannelCard>
          <ChannelCard title="Gmail" description="Gmail or Google Workspace mailboxes for customer order intake." connected={gmail.length} limit={company.maxGmailConnections} href="/api/gmail/connect">
            <div className="space-y-2">{gmail.length === 0 && <p className="text-sm text-slate-500">No Gmail mailbox connected yet.</p>}{gmail.map((item) => <div key={item.id} className="soft-panel text-sm"><p className="font-semibold">{item.email || 'Gmail mailbox connected'}</p><p className="text-slate-500">{item.isActive ? 'Active' : 'Inactive'}{item.lastCheckedAt ? ` • Last checked ${item.lastCheckedAt.toLocaleString()}` : ''}</p></div>)}</div>
          </ChannelCard>
        </section>

        <OutlookInboxClient connections={outlook.map((item) => ({ id: item.id, email: item.email, isActive: item.isActive }))} />
        <GmailInboxClient connections={gmail.map((item) => ({ id: item.id, email: item.email, isActive: item.isActive }))} />
      </main>
    </ClientPortalFrame>
  );
}
