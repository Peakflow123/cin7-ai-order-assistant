'use client';

import { useState } from 'react';

type Props = {
  channel: 'gmail' | 'outlook';
  onLoaded: (messages: any[]) => void;
};

export default function EmailLoadFilters({ channel, onLoaded }: Props) {
  const [limit, setLimit] = useState(50);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [includeNotOrders, setIncludeNotOrders] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    setMessage(`Loading ${channel === 'gmail' ? 'Gmail' : 'Outlook'} emails...`);

    const params = new URLSearchParams({ limit: String(limit), includeNotOrders: String(includeNotOrders) });
    if (fromDate) params.set('fromDate', fromDate);
    if (toDate) params.set('toDate', toDate);

    const response = await fetch(`/api/${channel}/recent?${params.toString()}`);
    const data = await response.json().catch(() => ({}));
    setLoading(false);

    if (!response.ok) {
      setMessage(data.message || 'Could not load emails.');
      return;
    }

    onLoaded(data.messages || []);
    setMessage(`Loaded ${(data.messages || []).length} emails.`);
  }

  return (
    <div className="soft-panel space-y-3">
      <div className="grid gap-3 md:grid-cols-4">
        <label className="text-sm font-bold text-slate-700">
          Limit
          <select className="input mt-1" value={limit} onChange={(event) => setLimit(Number(event.target.value))}>
            <option value={25}>Last 25 emails</option>
            <option value={50}>Last 50 emails</option>
            <option value={100}>Last 100 emails</option>
          </select>
        </label>
        <label className="text-sm font-bold text-slate-700">From date<input className="input mt-1" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /></label>
        <label className="text-sm font-bold text-slate-700">To date<input className="input mt-1" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} /></label>
        <label className="mt-7 flex items-center gap-2 text-sm font-bold text-slate-700"><input type="checkbox" checked={includeNotOrders} onChange={(event) => setIncludeNotOrders(event.target.checked)} /> Include not-order emails</label>
      </div>
      <button className="btn-secondary" disabled={loading} onClick={load}>{loading ? 'Loading...' : `Load ${channel === 'gmail' ? 'Gmail' : 'Outlook'} Emails`}</button>
      {message && <p className="text-sm font-semibold text-slate-600">{message}</p>}
    </div>
  );
}
