'use client';

import { useState } from 'react';

type Props = {
  accountId: string;
  baseUrl: string;
  hasConnection: boolean;
  lastStatus?: string | null;
  lastMessage?: string | null;
  lastProductsSync?: string | null;
  lastCustomersSync?: string | null;
};

export default function Cin7SettingsClient({ accountId, baseUrl, hasConnection, lastStatus, lastMessage, lastProductsSync, lastCustomersSync }: Props) {
  const [account, setAccount] = useState(accountId || '');
  const [url, setUrl] = useState(baseUrl || 'https://inventory.dearsystems.com/ExternalApi/v2');
  const [apiKey, setApiKey] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  async function save() {
    setSaving(true);
    setMessage('Saving Cin7 connection...');
    const response = await fetch('/api/settings/cin7', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accountId: account, apiKey, baseUrl: url }) });
    const text = await response.text();
    setSaving(false);
    setMessage(text || (response.ok ? 'Saved.' : 'Could not save Cin7 settings.'));
    if (response.ok) setApiKey('');
  }

  async function refresh(forceFull = false) {
    setSyncing(true);
    setMessage(forceFull ? 'Running full Cin7 refresh...' : 'Refreshing Cin7 changes...');
    const response = await fetch('/api/settings/cin7/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ forceFull }) });
    const data = await response.json().catch(async () => ({ message: await response.text() }));
    setSyncing(false);

    if (!response.ok) {
      setMessage(data.message || 'Cin7 refresh failed.');
      return;
    }

    setMessage(`Refresh complete. Products: ${data.products.created} created, ${data.products.updated} updated, ${data.products.skipped} skipped. Customers: ${data.customers.created} created, ${data.customers.updated} updated, ${data.customers.skipped} skipped.`);
  }

  return (
    <section className="card space-y-5">
      <div>
        <h2 className="text-xl font-black">Cin7 API Connection</h2>
        <p className="page-subtitle">Save the connection and refresh products/customers manually when needed. Daily automatic refresh also runs through the cron endpoint.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label><span className="section-label">Cin7 Account ID</span><input className="input mt-1" value={account} onChange={(event) => setAccount(event.target.value)} placeholder="Cin7 Account ID" /></label>
        <label><span className="section-label">Base URL</span><input className="input mt-1" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://inventory.dearsystems.com/ExternalApi/v2" /></label>
      </div>

      <label className="block"><span className="section-label">API Key {hasConnection ? '(leave blank to keep existing key)' : ''}</span><input className="input mt-1" type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="Cin7 API Key" /></label>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="soft-panel"><p className="font-bold">Last Product Sync</p><p className="text-sm text-slate-500">{lastProductsSync ? new Date(lastProductsSync).toLocaleString() : 'Never'}</p></div>
        <div className="soft-panel"><p className="font-bold">Last Customer Sync</p><p className="text-sm text-slate-500">{lastCustomersSync ? new Date(lastCustomersSync).toLocaleString() : 'Never'}</p></div>
      </div>

      {lastMessage && <div className="soft-panel"><p className="font-bold">Last Sync Status: {lastStatus || 'Unknown'}</p><p className="text-sm text-slate-600">{lastMessage}</p></div>}

      <div className="flex flex-wrap gap-2">
        <button className="btn" disabled={saving} onClick={save}>{saving ? 'Saving...' : 'Save Cin7 Settings'}</button>
        <button className="btn-secondary" disabled={syncing || !hasConnection} onClick={() => refresh(false)}>{syncing ? 'Refreshing...' : 'Refresh Products & Customers'}</button>
        <button className="btn-secondary" disabled={syncing || !hasConnection} onClick={() => refresh(true)}>Full Refresh</button>
        <a className="btn-secondary" href="/settings">Back to Settings</a>
      </div>

      {message && <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700">{message}</p>}
    </section>
  );
}
