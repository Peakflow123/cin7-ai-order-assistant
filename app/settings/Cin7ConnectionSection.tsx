'use client';

import { useState } from 'react';

type Props = {
  canEdit: boolean;
  hasConnection: boolean;
  accountId: string;
  baseUrl: string;
  lastStatus?: string | null;
  lastMessage?: string | null;
  lastProductsSync?: string | null;
  lastCustomersSync?: string | null;
};

export default function Cin7ConnectionSection({ canEdit, hasConnection, accountId, baseUrl, lastStatus, lastMessage, lastProductsSync, lastCustomersSync }: Props) {
  const [account, setAccount] = useState(accountId || '');
  const [url, setUrl] = useState(baseUrl || 'https://inventory.dearsystems.com/ExternalApi/v2');
  const [apiKey, setApiKey] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const locked = hasConnection && !canEdit;
  const showFields = !hasConnection || canEdit;

  async function save() {
    setSaving(true);
    setMessage('Saving Cin7 connection...');
    const response = await fetch('/api/settings/cin7', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accountId: account, apiKey, baseUrl: url }) });
    const text = await response.text();
    setSaving(false);
    setMessage(text || (response.ok ? 'Saved.' : 'Could not save Cin7 settings.'));
    if (response.ok) setApiKey('');
  }

  async function refresh() {
    setSyncing(true);
    setMessage('Refreshing updated Cin7 products and customers...');
    const response = await fetch('/api/settings/cin7/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    const data = await response.json().catch(async () => ({ message: await response.text() }));
    setSyncing(false);
    if (!response.ok) {
      setMessage(data.message || 'Cin7 refresh failed.');
      return;
    }
    setMessage(data.message || `Refresh complete. Products: ${data.products.created} created, ${data.products.updated} updated. Customers: ${data.customers.created} created, ${data.customers.updated} updated.`);
  }

  return (
    <section className="card space-y-5">
      <div>
        <h2 className="text-xl font-black">Cin7 Connection</h2>
        <p className="page-subtitle">Connect once, then refresh products and customers when needed. After first save, editing is locked unless the admin allows it.</p>
      </div>

      {locked && (
        <div className="soft-panel">
          <p className="font-bold">Cin7 connection is locked</p>
          <p className="mt-1 text-sm text-slate-500">Account ID: {accountId}</p>
          <p className="mt-1 text-sm text-slate-500">Only the admin can allow editing. Refresh is still available.</p>
        </div>
      )}

      {showFields && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label><span className="section-label">Cin7 Account ID</span><input className="input mt-1" value={account} onChange={(event) => setAccount(event.target.value)} placeholder="Cin7 Account ID" /></label>
            <label><span className="section-label">Base URL</span><input className="input mt-1" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://inventory.dearsystems.com/ExternalApi/v2" /></label>
          </div>
          <label className="block"><span className="section-label">API Key {hasConnection ? '(leave blank to keep existing key)' : ''}</span><input className="input mt-1" type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="Cin7 API Key" /></label>
          <button className="btn" disabled={saving} onClick={save}>{saving ? 'Saving...' : hasConnection ? 'Update Cin7 Connection' : 'Save Cin7 Connection'}</button>
        </div>
      )}

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
