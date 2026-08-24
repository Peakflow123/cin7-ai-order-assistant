'use client';

import { useState } from 'react';

type Account = { channel: 'gmail' | 'outlook'; email: string };

export default function OrderFilters({
  action,
  source,
  account,
  from,
  to,
  tab,
  accounts,
  columns = 5
}: {
  action: string;
  source: string;
  account: string;
  from: string;
  to: string;
  tab?: string;
  accounts: Account[];
  columns?: 5 | 2;
}) {
  const [channel, setChannel] = useState(source || '');
  const [mailbox, setMailbox] = useState(account || '');

  const visibleAccounts = accounts.filter((a) => (channel ? a.channel === channel : true));

  function onChannelChange(value: string) {
    setChannel(value);
    // reset mailbox if it no longer matches the chosen channel
    if (value && mailbox) {
      const stillValid = accounts.some((a) => a.email === mailbox && a.channel === value);
      if (!stillValid) setMailbox('');
    }
  }

  const gridClass = columns === 2 ? 'grid gap-3' : 'grid gap-3 md:grid-cols-5';

  return (
    <form className={gridClass} action={action} method="get">
      {tab && <input type="hidden" name="tab" value={tab} />}

      <label>
        <span className="section-label">Channel</span>
        <select className="input mt-1" name="source" value={channel} onChange={(e) => onChannelChange(e.target.value)}>
          <option value="">All channels</option>
          <option value="gmail">Gmail</option>
          <option value="outlook">Outlook</option>
        </select>
      </label>

      <label>
        <span className="section-label">Account / Mailbox</span>
        <select className="input mt-1" name="account" value={mailbox} onChange={(e) => setMailbox(e.target.value)}>
          <option value="">All accounts</option>
          {visibleAccounts.map((a) => (
            <option key={`${a.channel}:${a.email}`} value={a.email}>
              {a.email} ({a.channel === 'gmail' ? 'Gmail' : 'Outlook'})
            </option>
          ))}
        </select>
      </label>

      <label>
        <span className="section-label">From date</span>
        <input className="input mt-1" type="date" name="from" defaultValue={from} />
      </label>

      <label>
        <span className="section-label">To date</span>
        <input className="input mt-1" type="date" name="to" defaultValue={to} />
      </label>

      <div className="flex items-end gap-2">
        <button className="btn" type="submit">Filter</button>
        <a className="btn-secondary" href={tab ? `${action}?tab=${tab}` : action}>Clear</a>
      </div>
    </form>
  );
}
