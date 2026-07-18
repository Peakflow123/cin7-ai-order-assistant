'use client';

import { useState } from 'react';

export default function AdminCin7SyncButton({ companyId, hasCin7 }: { companyId: string; hasCin7: boolean }) {
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/companies/${companyId}/cin7-sync/start`, { method: 'POST' });
      const data = await response.json().catch(async () => ({ message: await response.text() }));
      setBusy(false);

      if (!response.ok) {
        alert(data.message || 'Could not queue Cin7 refresh.');
        return;
      }

      alert('Cin7 refresh queued. It will process in the background through the Cin7 cron worker.');
      window.location.reload();
    } catch (error) {
      setBusy(false);
      alert(error instanceof Error ? error.message : 'Could not queue Cin7 refresh.');
    }
  }

  if (!hasCin7) return <span className="text-xs text-slate-500">No Cin7 connection</span>;
  return <button className="btn-secondary px-3 py-2 text-sm" disabled={busy} onClick={refresh}>{busy ? 'Queuing...' : 'Queue Products & Customers Refresh'}</button>;
}
