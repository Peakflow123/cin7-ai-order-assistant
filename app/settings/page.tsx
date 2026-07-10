'use client';

import { useState } from 'react';

export default function Settings() {
  const [accountId, setAccountId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [message, setMessage] = useState('');

  async function save() {
    const response = await fetch('/api/cin7/save', { method: 'POST', body: JSON.stringify({ accountId, apiKey }) });
    setMessage(await response.text());
  }

  async function sync() {
    setMessage('Syncing...');
    const response = await fetch('/api/cin7/sync', { method: 'POST' });
    setMessage(await response.text());
  }

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <div className="card space-y-3">
        <h1 className="text-2xl font-bold">Cin7 Connection</h1>
        <input className="input" placeholder="Cin7 Account ID" onChange={(e) => setAccountId(e.target.value)} />
        <input className="input" placeholder="Cin7 API Key" onChange={(e) => setApiKey(e.target.value)} />
        <div className="flex gap-3">
          <button className="btn" onClick={save}>Save</button>
          <button className="btn" onClick={sync}>Sync products/customers</button>
        </div>
        <p>{message}</p>
      </div>
    </main>
  );
}
