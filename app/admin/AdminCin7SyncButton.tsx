'use client';

import { useState } from 'react';

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

export default function AdminCin7SyncButton({ companyId, hasCin7 }: { companyId: string; hasCin7: boolean }) {
  const [syncing, setSyncing] = useState(false);

  async function runJob(jobId: string) {
    for (let i = 0; i < 300; i += 1) {
      const response = await fetch(`/api/sync-jobs/${jobId}/run`, { method: 'POST' });
      const data = await response.json().catch(async () => ({ message: await response.text() }));

      if (!response.ok) {
        alert(data.message || 'Cin7 refresh failed.');
        setSyncing(false);
        return;
      }

      if (data.status === 'COMPLETED') {
        alert(`Cin7 refresh complete. ${jobSummary(data)}`);
        setSyncing(false);
        window.location.reload();
        return;
      }

      if (data.status === 'FAILED') {
        alert(data.error || 'Cin7 refresh failed.');
        setSyncing(false);
        return;
      }

      if (data.status === 'PAUSED') await new Promise((resolve) => setTimeout(resolve, 60000));
      else await new Promise((resolve) => setTimeout(resolve, 1200));
    }

    alert('Cin7 refresh is still running. Please check activity/logs later.');
    setSyncing(false);
  }

  async function refresh() {
    setSyncing(true);
    const response = await fetch(`/api/admin/companies/${companyId}/cin7-sync/start`, { method: 'POST' });
    const data = await response.json().catch(async () => ({ message: await response.text() }));

    if (!response.ok) {
      alert(data.message || 'Could not start Cin7 refresh.');
      setSyncing(false);
      return;
    }

    await runJob(data.id);
  }

  if (!hasCin7) return <span className="text-xs text-slate-500">No Cin7 connection</span>;
  return <button className="btn-secondary px-3 py-2 text-sm" disabled={syncing} onClick={refresh}>{syncing ? 'Refreshing...' : 'Refresh Products & Customers'}</button>;
}
