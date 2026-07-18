'use client';

import { useState } from 'react';

export default function AdminCin7SyncButton({ companyId, hasCin7 }: { companyId: string; hasCin7: boolean }) {
  const [syncing, setSyncing] = useState(false);

  async function refresh() {
    setSyncing(true);
    try {
      const response = await fetch(`/api/admin/companies/${companyId}/cin7-refresh`, { method: 'POST' });
      const text = await response.text();
      let data: any = {};
      try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
      setSyncing(false);

      if (!response.ok) {
        alert(data.message || 'Cin7 Core refresh failed.');
        return;
      }

      alert(data.message || 'Cin7 Core refresh completed.');
      window.location.reload();
    } catch (error) {
      setSyncing(false);
      alert(error instanceof Error ? error.message : 'Cin7 Core refresh failed.');
    }
  }

  if (!hasCin7) return <span className="text-xs text-slate-500">No Cin7 connection</span>;
  return <button className="btn-secondary px-3 py-2 text-sm" disabled={syncing} onClick={refresh}>{syncing ? 'Refreshing...' : 'Refresh Products & Customers'}</button>;
}
