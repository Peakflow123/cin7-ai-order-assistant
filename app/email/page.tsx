import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, isPlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import GmailInboxClient from './GmailInboxClient';
import OutlookInboxClient from './OutlookInboxClient';
import InboundOrderEmailCard from './InboundOrderEmailCard';
import ClientPortalFrame from '@/components/ClientPortalFrame';

function ChannelCard(props: { title: string; description: string; connected: number; limit: number; href?: string; reconnectAllowed: boolean; children?: React.ReactNode; }) {
  const remaining = Math.max(0, props.limit - props.connected);
  const canConnect = remaining > 0 && props.href && (props.connected === 0 || props.reconnectAllowed);
  const disabledReason = props.connected > 0 && !props.reconnectAllowed ? 'Additional connections are disabled by admin' : 'Connection limit reached';
  return <section className="card space-y-4"><div className="flex items-center justify-between gap-3"><h2 className="text-xl font-black">{props.title}</h2><span className={props.connected > 0 ? 'badge badge-green' : 'badge badge-yellow'}>{props.connected}/{props.limit}</span></div><p className="text-sm text-slate-500">{props.description}</p>{props.children}{canConnect ? <a className="btn-secondary w-full" href={props.href}>Connect {props.title}</a> : <button className="btn-secondary w-full" disabled>{disabledReason}</button>}</section>;
}

export default async function InputChannelsPage() {
  const session = getSession();
  if (!session) redirect('/login');
  if (isPlatformAdmin(session)) redirect('/admin');
  const company = await prisma.company.findUnique({ where: { id: session.companyId } });
  if (!company) redirect('/login');
  const [outlook, gmail, controlRows] = await Promise.all([
    prisma.outlookConnection.findMany({ where: { companyId: session.companyId, isActive: true }, orderBy: { createdAt: 'desc' } }),
    prisma.gmailConnection.findMany({ where: { companyId: session.companyId, isActive: true }, orderBy: { createdAt: 'desc' } }),
    prisma.$queryRawUnsafe<any[]>(`SELECT COALESCE("allowClientReconnectEmail",TRUE) AS "allowClientReconnectEmail",COALESCE("allowAiClassificationOnLoad",FALSE) AS "allowAiClassificationOnLoad","inboundEmailToken",COALESCE("inboundEmailEnabled",TRUE) AS "inboundEmailEnabled" FROM "Company" WHERE "id"=$1 LIMIT 1`, session.companyId)
  ]);
  const controls = controlRows[0] || {};
  const reconnectAllowed = controls.allowClientReconnectEmail === undefined ? true : Boolean(controls.allowClientReconnectEmail);
  const allowAiClassificationOnLoad = Boolean(controls.allowAiClassificationOnLoad);
  const inboundDomain = process.env.INBOUND_EMAIL_DOMAIN || 'orders.nexorderai.com';
  const inboundAddress = `orders-${controls.inboundEmailToken}@${inboundDomain}`;
  return <ClientPortalFrame companyName={company.name}><main className="page-shell space-y-6">
    <section className="client-hero"><div className="relative z-10"><Link href="/dashboard" className="text-sm font-bold text-blue-700 hover:text-blue-900">Back to Dashboard</Link><h1 className="page-title mt-2">Channels</h1><p className="page-subtitle">Forward orders to your private NexOrder address, or connect Gmail and Outlook as optional channels.</p></div></section>
    <InboundOrderEmailCard address={inboundAddress} enabled={Boolean(controls.inboundEmailEnabled)} />
    <section className="client-grid-2">
      <ChannelCard title="Outlook" description="Optional Microsoft 365 or personal Outlook mailbox connection." connected={outlook.length} limit={company.maxOutlookConnections} href="/api/outlook/connect" reconnectAllowed={reconnectAllowed}><div className="space-y-2">{outlook.length === 0 && <p className="text-sm text-slate-500">No Outlook mailbox connected.</p>}{outlook.map((item) => <div key={item.id} className="soft-panel text-sm"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{item.email || 'Outlook mailbox connected'}</p><p className="text-slate-500">{item.isActive ? 'Active' : 'Inactive'}</p></div><form action={`/api/outlook/connections/${item.id}`} method="post"><button className="btn-danger" type="submit" disabled={!reconnectAllowed}>Remove</button></form></div></div>)}</div></ChannelCard>
      <ChannelCard title="Gmail" description="Optional Gmail or Google Workspace mailbox connection." connected={gmail.length} limit={company.maxGmailConnections} href="/api/gmail/connect" reconnectAllowed={reconnectAllowed}><div className="space-y-2">{gmail.length === 0 && <p className="text-sm text-slate-500">No Gmail mailbox connected.</p>}{gmail.map((item) => <div key={item.id} className="soft-panel text-sm"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{item.email || 'Gmail mailbox connected'}</p><p className="text-slate-500">{item.isActive ? 'Active' : 'Inactive'}</p></div><form action={`/api/gmail/connections/${item.id}`} method="post"><button className="btn-danger" type="submit" disabled={!reconnectAllowed}>Remove</button></form></div></div>)}</div></ChannelCard>
    </section>
    <OutlookInboxClient connections={outlook.map((item) => ({ id: item.id, email: item.email, isActive: item.isActive }))} allowAiClassificationOnLoad={allowAiClassificationOnLoad} />
    <GmailInboxClient connections={gmail.map((item) => ({ id: item.id, email: item.email, isActive: item.isActive }))} allowAiClassificationOnLoad={allowAiClassificationOnLoad} />
  </main></ClientPortalFrame>;
}
