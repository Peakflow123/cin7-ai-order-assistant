'use client';
import { useState } from 'react';

type Account = { channel: 'gmail' | 'outlook' | 'inbound-email'; email: string };
const channelNames: Record<Account['channel'], string> = {
  gmail: 'Gmail', outlook: 'Outlook', 'inbound-email': 'Direct Email'
};

export default function OrderFilters({ action, q = '', source, account, from, to, tab, accounts, columns = 5 }: {
  action: string; q?: string; source: string; account: string; from: string; to: string; tab?: string;
  accounts: Account[]; columns?: 5 | 2;
}) {
  const [channel, setChannel] = useState(source || '');
  const [mailbox, setMailbox] = useState(account || '');
  const visibleAccounts = accounts.filter((a) => (channel ? a.channel === channel : true));
  function onChannelChange(value: string) {
    setChannel(value);
    if (value && mailbox && !accounts.some((a) => a.email === mailbox && a.channel === value)) setMailbox('');
  }
  const gridClass = columns === 2 ? 'grid gap-3' : 'grid gap-3 md:grid-cols-5';
  return <form className={gridClass} action={action} method="get">
    {tab && <input type="hidden" name="tab" value={tab} />}
    <label className={columns === 2 ? '' : 'md:col-span-5'}><span className="section-label">Search</span><input className="input mt-1" type="text" name="q" defaultValue={q} placeholder="Customer name or order reference / PO" /></label>
    <label><span className="section-label">Channel</span><select className="input mt-1" name="source" value={channel} onChange={(e) => onChannelChange(e.target.value)}>
      <option value="">All channels</option><option value="gmail">Gmail</option><option value="outlook">Outlook</option><option value="inbound-email">Direct Email</option>
    </select></label>
    <label><span className="section-label">Account / Mailbox</span><select className="input mt-1" name="account" value={mailbox} onChange={(e) => setMailbox(e.target.value)}>
      <option value="">All accounts</option>{visibleAccounts.map((a) => <option key={`${a.channel}:${a.email}`} value={a.email}>{a.email} ({channelNames[a.channel]})</option>)}
    </select></label>
    <label><span className="section-label">From date</span><input className="input mt-1" type="date" name="from" defaultValue={from} /></label>
    <label><span className="section-label">To date</span><input className="input mt-1" type="date" name="to" defaultValue={to} /></label>
    <div className="flex items-end gap-2"><button className="btn" type="submit">Filter</button><a className="btn-secondary" href={tab ? `${action}?tab=${tab}` : action}>Clear</a></div>
  </form>;
}
