'use client';

import { useState } from 'react';

type Props = {
  accountId: string;
  apiKey: string;
  hasConnection: boolean;
  lastStatus?: string | null;
  lastMessage?: string | null;
  lastProductsSync?: string | null;
  lastCustomersSync?: string | null;
};

export default function Cin7ConnectionSection({ accountId, apiKey, hasConnection, lastStatus, lastMessage, lastProductsSync, lastCustomersSync }: Props) {
  const [account, setAccount] = useState(accountId || '');
  const [key, setKey] = useState(apiKey || '');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  async function save() {
    setSaving(true);
    setMessage('Saving Cin7 Core connection...');

    const response = await fetch('/api/settings/cin7', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId: account, apiKey: key })
    });

    const text = await response.text();
    setSaving(false);
    setMessage(text || (response.ok ? 'Saved.' : 'Could not save Cin7 Core settings.'));
  }

  async function refresh() {
    setSyncing(true);
    setMessage('Refreshing Cin7 Core products and customers...');

    try {
      const response = await fetch('/api/settings/cin7/refresh', { method: 'POST' });
      const text = await response.text();
      let data: any = {};
      try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
      setSyncing(false);

      if (!response.ok) {
        setMessage(data.message || 'Cin7 Core refresh failed.');
        return;
      }

      setMessage(data.message || 'Cin7 Core refresh completed.');
    } catch (error) {
      setSyncing(false);
      setMessage(error instanceof Error ? error.message : 'Cin7 Core refresh failed.');
    }
  }

  return (
    <section className="card space-y-5">
      <div>
        <h2 className="text-xl font-black">Cin7 Connection</h2>
        <p className="page-subtitle">Simple Cin7 Core setup. Enter Account ID and API Key, save, then manually refresh products and customers.</p>
      </div>

      <div className="space-y-4">
        <label>
          <span className="section-label">Cin7 Account ID</span>
          <input className="input mt-1" value={account} onChange={(event) => setAccount(event.target.value)} placeholder="Cin7 Account ID" />
        </label>

        <label className="block">
          <span className="section-label">Cin7 API Key</span>
          <input className="input mt-1" value={key} onChange={(event) => setKey(event.target.value)} placeholder="Cin7 API Key" />
        </label>

        <button className="btn" disabled={saving} onClick={save}>{saving ? 'Saving...' : hasConnection ? 'Update Cin7 Connection' : 'Save Cin7 Connection'}</button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="soft-panel"><p className="font-bold">Last Product Sync</p><p className="text-sm text-slate-500">{lastProductsSync ? new Date(lastProductsSync).toLocaleString() : 'Never'}</p></div>
        <div className="soft-panel"><p className="font-bold">Last Customer Sync</p><p className="text-sm text-slate-500">{lastCustomersSync ? new Date(lastCustomersSync).toLocaleString() : 'Never'}</p></div>
      </div>

      {lastMessage && <div className="soft-panel"><p className="font-bold">Last Sync Status: {lastStatus || 'Unknown'}</p><p className="text-sm text-slate-600">{lastMessage}</p></div>}

      <button className="btn-secondary w-full md:w-auto" disabled={syncing || !hasConnection} onClick={refresh}>{syncing ? 'Refreshing...' : 'Refresh Products & Customers'}</button>
      {message && <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700">{message}</p>}
    </section>
  );
}
