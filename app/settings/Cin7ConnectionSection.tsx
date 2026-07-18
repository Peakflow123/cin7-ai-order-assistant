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

type Totals = {
  productsCreated: number;
  productsUpdated: number;
  productsSkipped: number;
  customersCreated: number;
  customersUpdated: number;
  customersSkipped: number;
};

function newTotals(): Totals {
  return { productsCreated: 0, productsUpdated: 0, productsSkipped: 0, customersCreated: 0, customersUpdated: 0, customersSkipped: 0 };
}

export default function Cin7ConnectionSection({ accountId, apiKey, hasConnection, lastStatus, lastMessage, lastProductsSync, lastCustomersSync }: Props) {
  const [account, setAccount] = useState(accountId || '');
  const [key, setKey] = useState(apiKey || '');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState('');

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

  async function postJson(url: string, body: any) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const text = await response.text();
    let data: any = {};

    try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
    if (!response.ok) throw new Error(data.message || 'Cin7 Core request failed.');
    return data;
  }

  async function refreshEntity(entity: 'Product' | 'Customer', since: string | null, totals: Totals) {
    for (let page = 1; page <= 500; page += 1) {
      setMessage(`Refreshing ${entity === 'Product' ? 'products' : 'customers'} page ${page}...`);
      const data = await postJson('/api/settings/cin7/refresh-step', { entity, page, since });

      if (entity === 'Product') {
        totals.productsCreated += data.created || 0;
        totals.productsUpdated += data.updated || 0;
        totals.productsSkipped += data.skipped || 0;
      } else {
        totals.customersCreated += data.created || 0;
        totals.customersUpdated += data.updated || 0;
        totals.customersSkipped += data.skipped || 0;
      }

      setProgress(`Latest: ${entity} page ${page}. Fetched ${data.fetched || 0}. Batch ${data.batchSize || 10}. Created ${data.created || 0}. Updated ${data.updated || 0}. Skipped ${data.skipped || 0}.`);
      if (data.done) break;
    }
  }

  async function refresh() {
    setSyncing(true);
    setProgress('');
    setMessage('Starting Cin7 Core refresh with small batches...');
    const totals = newTotals();

    try {
      await refreshEntity('Product', lastProductsSync ?? null, totals);
      await refreshEntity('Customer', lastCustomersSync ?? null, totals);
      const complete = await postJson('/api/settings/cin7/refresh-complete', totals);
      setMessage(complete.message || 'Cin7 Core refresh completed.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Cin7 Core refresh failed.');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <section className="card space-y-5">
      <div>
        <h2 className="text-xl font-black">Cin7 Connection</h2>
        <p className="page-subtitle">Simple Cin7 Core setup. Refresh runs in small safe batches to avoid Vercel timeout.</p>
      </div>

      <div className="space-y-4">
        <label><span className="section-label">Cin7 Account ID</span><input className="input mt-1" value={account} onChange={(event) => setAccount(event.target.value)} placeholder="Cin7 Account ID" /></label>
        <label className="block"><span className="section-label">Cin7 API Key</span><input className="input mt-1" value={key} onChange={(event) => setKey(event.target.value)} placeholder="Cin7 API Key" /></label>
        <button className="btn" disabled={saving} onClick={save}>{saving ? 'Saving...' : hasConnection ? 'Update Cin7 Connection' : 'Save Cin7 Connection'}</button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="soft-panel"><p className="font-bold">Last Product Sync</p><p className="text-sm text-slate-500">{lastProductsSync ? new Date(lastProductsSync).toLocaleString() : 'Never'}</p></div>
        <div className="soft-panel"><p className="font-bold">Last Customer Sync</p><p className="text-sm text-slate-500">{lastCustomersSync ? new Date(lastCustomersSync).toLocaleString() : 'Never'}</p></div>
      </div>

      {lastMessage && <div className="soft-panel"><p className="font-bold">Last Sync Status: {lastStatus || 'Unknown'}</p><p className="text-sm text-slate-600">{lastMessage}</p></div>}

      <button className="btn-secondary w-full md:w-auto" disabled={syncing || !hasConnection} onClick={refresh}>{syncing ? 'Refreshing...' : 'Refresh Products & Customers'}</button>
      {progress && <p className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm font-semibold text-blue-800">{progress}</p>}
      {message && <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700">{message}</p>}
    </section>
  );
}
