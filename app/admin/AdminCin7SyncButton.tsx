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

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export default function AdminCin7SyncButton({ companyId, hasCin7 }: { companyId: string; hasCin7: boolean }) {
  const [syncing, setSyncing] = useState(false);

  async function runJob(jobId: string) {
    for (let i = 0; i < 500; i += 1) {
      try {
        const response = await fetchWithTimeout(`/api/sync-jobs/${jobId}/run`, { method: 'POST' }, 25000);
        const data = await response.json().catch(async () => ({ message: await response.text() })) as Job | { message?: string };

        if (!response.ok) {
          alert('message' in data && data.message ? data.message : 'Cin7 refresh failed.');
          setSyncing(false);
          return;
        }

        const current = data as Job;
        if (current.status === 'COMPLETED') {
          alert(`Cin7 refresh complete. ${jobSummary(current)}`);
          setSyncing(false);
          window.location.reload();
          return;
        }

        if (current.status === 'FAILED') {
          alert(current.error || 'Cin7 refresh failed.');
          setSyncing(false);
          return;
        }

        if (current.status === 'PAUSED') await new Promise((resolve) => setTimeout(resolve, 60000));
        else await new Promise((resolve) => setTimeout(resolve, 1500));
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Cin7 refresh failed. Please check logs.');
        setSyncing(false);
        return;
      }
    }

    alert('Cin7 refresh is still running. Please check again later.');
    setSyncing(false);
  }

  async function refresh() {
    setSyncing(true);

    try {
      const response = await fetchWithTimeout(`/api/admin/companies/${companyId}/cin7-sync/start`, { method: 'POST' }, 15000);
      const data = await response.json().catch(async () => ({ message: await response.text() })) as Job | { message?: string };

      if (!response.ok) {
        alert('message' in data && data.message ? data.message : 'Could not start Cin7 refresh.');
        setSyncing(false);
        return;
      }

      await runJob((data as Job).id);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Could not start Cin7 refresh.');
      setSyncing(false);
    }
  }

  if (!hasCin7) return <span className="text-xs text-slate-500">No Cin7 connection</span>;
  return <button className="btn-secondary px-3 py-2 text-sm" disabled={syncing} onClick={refresh}>{syncing ? 'Refreshing...' : 'Refresh Products & Customers'}</button>;
}
