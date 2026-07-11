'use client';

import { useState } from 'react';

export default function ClientAdminForm(props: {
  companyId: string;
  companyName: string;
  cin7AccountId: string;
  allowClientCin7Edit: boolean;
  autoCreateEnabled: boolean;
  autoCreateThreshold: number;
}) {
  const [accountId, setAccountId] = useState(props.cin7AccountId);
  const [apiKey, setApiKey] = useState('');
  const [allowClientCin7Edit, setAllowClientCin7Edit] = useState(props.allowClientCin7Edit);
  const [autoCreateEnabled, setAutoCreateEnabled] = useState(props.autoCreateEnabled);
  const [autoCreateThreshold, setAutoCreateThreshold] = useState(props.autoCreateThreshold);
  const [message, setMessage] = useState('');

  async function saveCin7() {
    setMessage('Saving Cin7 credentials...');
    const response = await fetch(`/api/admin/clients/${props.companyId}/cin7`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId, apiKey })
    });
    setMessage(await response.text());
  }

  async function saveSettings() {
    setMessage('Saving settings...');
    const response = await fetch(`/api/admin/clients/${props.companyId}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allowClientCin7Edit, autoCreateEnabled, autoCreateThreshold })
    });
    setMessage(await response.text());
  }

  async function refreshData() {
    setMessage('Refreshing products/customers...');
    const response = await fetch(`/api/admin/clients/${props.companyId}/sync`, { method: 'POST' });
    setMessage(await response.text());
  }

  return (
    <div className="card space-y-4">
      <h2 className="text-xl font-bold">Admin Controls</h2>

      <div className="grid md:grid-cols-2 gap-3">
        <input className="input" value={accountId} placeholder="Cin7 Account ID" onChange={(event) => setAccountId(event.target.value)} />
        <input className="input" value={apiKey} placeholder="New Cin7 API Key - leave blank to keep current" onChange={(event) => setApiKey(event.target.value)} />
      </div>

      <div className="flex gap-3 flex-wrap">
        <button className="btn" onClick={saveCin7}>Save/Replace Cin7 Credentials</button>
        <button className="btn" onClick={refreshData}>Refresh Products/Customers</button>
      </div>

      <div className="border-t pt-4 space-y-3">
        <label className="flex gap-2 items-center">
          <input type="checkbox" checked={allowClientCin7Edit} onChange={(event) => setAllowClientCin7Edit(event.target.checked)} />
          Allow client to edit Cin7 credentials after first connection
        </label>

        <label className="flex gap-2 items-center">
          <input type="checkbox" checked={autoCreateEnabled} onChange={(event) => setAutoCreateEnabled(event.target.checked)} />
          Auto-create Cin7 order when confidence is high enough
        </label>

        <label className="block">
          <span className="font-medium">Auto-create threshold</span>
          <input className="input mt-1" type="number" min="0" max="1" step="0.01" value={autoCreateThreshold} onChange={(event) => setAutoCreateThreshold(Number(event.target.value))} />
          <span className="text-sm text-slate-500">Example: 0.9 means 90% confidence.</span>
        </label>

        <button className="btn" onClick={saveSettings}>Save Settings</button>
      </div>

      <p className="whitespace-pre-wrap">{message}</p>
    </div>
  );
}
