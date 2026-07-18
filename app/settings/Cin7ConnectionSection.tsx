'use client';

import { useState } from 'react';

type Props = {
  canEdit: boolean;
  hasConnection: boolean;
  accountId: string;
  lastStatus?: string | null;
  lastMessage?: string | null;
  lastProductsSync?: string | null;
  lastCustomersSync?: string | null;
};

type Job = {
  id: string;
  status: string;
  phase: string;
  page: number;
  message?: string | null;
  error?: string | null;
  productsCreated: number;
  productsUpdated: number;
  productsSkipped: number;
  customersCreated: number;
  customersUpdated: number;
  customersSkipped: number;
};

function jobSummary(job: Job) {
  return `Products: ${job.productsCreated} created, ${job.productsUpdated} updated, ${job.productsSkipped} skipped. Customers: ${job.customersCreated} created, ${job.customersUpdated} updated, ${job.customersSkipped} skipped.`;
}

export default function Cin7ConnectionSection({ canEdit, hasConnection, accountId, lastStatus, lastMessage, lastProductsSync, lastCustomersSync }: Props) {
  const [account, setAccount] = useState(accountId || '');
  const [apiKey, setApiKey] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [job, setJob] = useState<Job | null>(null);

  const locked = hasConnection && !canEdit;
  const showFields = !hasConnection || canEdit;

  async function save() {
    setSaving(true);
    setMessage('Saving Cin7 connection...');
    const response = await fetch('/api/settings/cin7', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId: account, apiKey })
    });
    const text = await response.text();
    setSaving(false);
    setMessage(text || (response.ok ? 'Saved.' : 'Could not save Cin7 settings.'));
    if (response.ok) setApiKey('');
  }

  async function checkJob(jobId: string) {
    const response = await fetch(`/api/sync-jobs/${jobId}`, { method: 'GET', cache: 'no-store' });
    if (!response.ok) return;
    const current = await response.json() as Job;
    setJob(current);
    setMessage(current.message || `Current status: ${current.status}. ${jobSummary(current)}`);
  }

  async function refresh() {
    setSyncing(true);
    setMessage('Queuing Cin7 product/customer refresh...');

    try {
      const response = await fetch('/api/settings/cin7/sync/start', { method: 'POST' });
      const data = await response.json().catch(async () => ({ message: await response.text() })) as Job | { message?: string };

      if (!response.ok) {
        setMessage('message' in data && data.message ? data.message : 'Could not queue Cin7 refresh.');
        setSyncing(false);
        return;
      }

      const queuedJob = data as Job;
      setJob(queuedJob);
      setMessage('Cin7 refresh has been queued. It will process in the background through the Cin7 cron worker. You can leave this page.');
      setSyncing(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not queue Cin7 refresh.');
      setSyncing(false);
    }
  }

  return (
    <section className="card space-y-5">
      <div>
        <h2 className="text-xl font-black">Cin7 Connection</h2>
        <p className="page-subtitle">Connect once, then queue product/customer refresh. Base URL is hidden and handled by the system.</p>
      </div>

      {locked && (
        <div className="soft-panel">
          <p className="font-bold">Cin7 connection is locked</p>
          <p className="mt-1 text-sm text-slate-500">Account ID: {accountId}</p>
          <p className="mt-1 text-sm text-slate-500">Only the admin can allow credential editing. Refresh queue is still available.</p>
        </div>
      )}

      {showFields && (
        <div className="space-y-4">
          <label><span className="section-label">Cin7 Account ID</span><input className="input mt-1" value={account} onChange={(event) => setAccount(event.target.value)} placeholder="Cin7 Account ID" /></label>
          <label className="block"><span className="section-label">API Key {hasConnection ? '(leave blank to keep existing key)' : ''}</span><input className="input mt-1" type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="Cin7 API Key" /></label>
          <button className="btn" disabled={saving} onClick={save}>{saving ? 'Saving...' : hasConnection ? 'Update Cin7 Connection' : 'Save Cin7 Connection'}</button>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <div className="soft-panel"><p className="font-bold">Last Product Sync</p><p className="text-sm text-slate-500">{lastProductsSync ? new Date(lastProductsSync).toLocaleString() : 'Never'}</p></div>
        <div className="soft-panel"><p className="font-bold">Last Customer Sync</p><p className="text-sm text-slate-500">{lastCustomersSync ? new Date(lastCustomersSync).toLocaleString() : 'Never'}</p></div>
      </div>

      {lastMessage && <div className="soft-panel"><p className="font-bold">Last Sync Status: {lastStatus || 'Unknown'}</p><p className="text-sm text-slate-600">{lastMessage}</p></div>}

      <div className="flex flex-wrap gap-2">
        <button className="btn-secondary" disabled={syncing || !hasConnection} onClick={refresh}>{syncing ? 'Queuing...' : 'Queue Products & Customers Refresh'}</button>
        {job && <button className="btn-secondary" onClick={() => checkJob(job.id)}>Check Refresh Status</button>}
      </div>

      {job && <div className="soft-panel"><p className="font-bold">Current refresh job</p><p className="text-sm text-slate-500">Status: {job.status} • Step: {job.phase} • Page: {job.page}</p><p className="mt-1 text-sm text-slate-500">{jobSummary(job)}</p></div>}
      {message && <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700">{message}</p>}
    </section>
  );
}
