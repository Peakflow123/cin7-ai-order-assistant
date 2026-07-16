import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import GmailInboxClient from './GmailInboxClient';
import OutlookInboxClient from './OutlookInboxClient';
import WhatsAppSettingsClient from './WhatsAppSettingsClient';

function ChannelCard(props: { title: string; description: string; connected: number; limit: number; href?: string; children?: React.ReactNode }) {
  const remaining = Math.max(0, props.limit - props.connected);
  const canConnect = remaining > 0 && props.href;
  return (
    <section className="card space-y-4">
      <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-black">{props.title}</h2><span className={props.connected > 0 ? 'badge badge-green' : 'badge badge-yellow'}>{props.connected}/{props.limit} connected</span></div>
      <p className="text-slate-600">{props.description}</p>
      {props.children}
      {canConnect ? <a className="btn-secondary w-full" href={props.href}>Connect another {props.title}</a> : <button className="btn-secondary w-full" disabled>Connection limit reached</button>}
      <p className="text-xs text-slate-500">Remaining allowed connections: {remaining}</p>
    </section>
  );
}

export default async function InputChannelsPage() {
  const session = getSession();
  if (!session) redirect('/login');

  const company = await prisma.company.findUnique({ where: { id: session.companyId } });
  if (!company) redirect('/login');

  const [outlook, gmail, whatsapp] = await Promise.all([
    prisma.outlookConnection.findMany({ where: { companyId: session.companyId }, orderBy: { createdAt: 'desc' } }),
    prisma.gmailConnection.findMany({ where: { companyId: session.companyId }, orderBy: { createdAt: 'desc' } }),
    prisma.whatsappConnection.findMany({ where: { companyId: session.companyId }, orderBy: { createdAt: 'desc' } })
  ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cin7-ai-order-assistant-three.vercel.app';
  const webhookUrl = `${appUrl}/api/whatsapp/webhook`;

  return (
    <main className="page-shell space-y-6">
      <div className="hero-card"><Link href="/dashboard" className="text-sm font-bold text-blue-700 hover:text-blue-900">← Back to Dashboard</Link><h1 className="page-title mt-2">Input Channels</h1><p className="page-subtitle">Connect Gmail, Outlook and WhatsApp order channels. Gmail and Outlook can be polled by the external cron route.</p></div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChannelCard title="Microsoft Outlook" description="Connect Microsoft 365/Outlook mailboxes for customer order emails and attachments." connected={outlook.length} limit={company.maxOutlookConnections} href="/api/outlook/connect">
          <div className="space-y-2">{outlook.length === 0 && <p className="text-sm text-slate-500">No Outlook mailbox connected yet.</p>}{outlook.map((item) => <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm"><p className="font-semibold">{item.email || 'Outlook mailbox connected'}</p><p className="text-slate-500">Status: {item.isActive ? 'Active' : 'Inactive'}{item.lastCheckedAt ? ` • Last checked ${item.lastCheckedAt.toLocaleString()}` : ''}</p></div>)}</div>
        </ChannelCard>
        <ChannelCard title="Gmail" description="Connect Gmail or Google Workspace mailboxes for customer order intake." connected={gmail.length} limit={company.maxGmailConnections} href="/api/gmail/connect">
          <div className="space-y-2">{gmail.length === 0 && <p className="text-sm text-slate-500">No Gmail mailbox connected yet.</p>}{gmail.map((item) => <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm"><p className="font-semibold">{item.email || 'Gmail mailbox connected'}</p><p className="text-slate-500">Status: {item.isActive ? 'Active' : 'Inactive'}{item.lastCheckedAt ? ` • Last checked ${item.lastCheckedAt.toLocaleString()}` : ''}</p></div>)}</div>
        </ChannelCard>
        <section className="card space-y-4"><div className="flex items-center justify-between gap-3"><h2 className="text-xl font-black">WhatsApp</h2><span className={whatsapp.length > 0 ? 'badge badge-green' : 'badge badge-yellow'}>{whatsapp.length}/{company.maxWhatsappConnections} connected</span></div><p className="text-slate-600">Receive inbound WhatsApp message orders through Meta WhatsApp Cloud API webhooks.</p><div className="space-y-2">{whatsapp.length === 0 && <p className="text-sm text-slate-500">No WhatsApp number connected yet.</p>}{whatsapp.map((item) => <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm"><p className="font-semibold">{item.displayPhoneNumber || item.phoneNumberId}</p><p className="text-slate-500">Status: {item.isActive ? 'Active' : 'Inactive'}</p></div>)}</div></section>
      </div>

      <OutlookInboxClient connections={outlook.map((item) => ({ id: item.id, email: item.email, isActive: item.isActive }))} />
      <GmailInboxClient connections={gmail.map((item) => ({ id: item.id, email: item.email, isActive: item.isActive }))} />
      <WhatsAppSettingsClient webhookUrl={webhookUrl} />
    </main>
  );
}
