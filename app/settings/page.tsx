'use client';

import { useEffect, useState } from 'react';

type Cin7Status = {
  connected: boolean;
  accountId: string | null;
  canEdit: boolean;
  message: string;
};

export default function Settings() {
  const [accountId, setAccountId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<Cin7Status | null>(null);

  async function loadStatus() {
    const response = await fetch('/api/cin7/status');
    const data = await response.json();
    setStatus(data);
    if (data.accountId) setAccountId(data.accountId);
  }

  useEffect(() => {
    void loadStatus();
  }, []);

  async function save() {
    setMessage('Saving...');
    const response = await fetch('/api/cin7/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId, apiKey })
    });
    const text = await response.text();
    setMessage(text);
    await loadStatus();
  }

  async function sync() {
    setMessage('Refreshing products/customers from Cin7...');
    const response = await fetch('/api/cin7/sync', { method: 'POST' });
    setMessage(await response.text());
  }

  if (!status) return <main className="p-6">Loading...</main>;

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <div className="card space-y-4">
        <h1 className="text-2xl font-bold">Cin7 Connection</h1>

        {status.connected && (
          <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-green-800">
            Cin7 is connected. Clients can refresh products/customers, but cannot replace API credentials unless admin allows it.
          </div>
        )}

        {!status.canEdit && (
          <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-3 text-yellow-800">
            API credentials are locked. Please ask platform admin to change Cin7 credentials.
          </div>
        )}

        <input
          className="input"
          placeholder="Cin7 Account ID"
          value={accountId}
          disabled={!status.canEdit}
          onChange={(event) => setAccountId(event.target.value)}
        />

        <input
          className="input"
          placeholder={status.connected ? 'API Key is saved. Enter new key only if admin allows changes.' : 'Cin7 API Key'}
          value={apiKey}
          disabled={!status.canEdit}
          onChange={(event) => setApiKey(event.target.value)}
        />

        <div className="flex gap-3">
          {status.canEdit && <button className="btn" onClick={save}>Save Cin7 Credentials</button>}
          <button className="btn" onClick={sync}>Refresh Products/Customers</button>
        </div>

        <p className="whitespace-pre-wrap">{message}</p>
      </div>
    </main>
  );
}
