'use client';

import { useState } from 'react';

export default function AdminCin7SyncButton({ companyId, hasCin7 }: { companyId: string; hasCin7: boolean }) {
  const [syncing, setSyncing] = useState(false);

  async function refresh(forceFull = false) {
    setSyncing(true);
    const response = await fetch(`/api/admin/companies/${companyId}/cin7-sync`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ forceFull }) });
    const data = await response.json().catch(async () => ({ message: await response.text() }));
    setSyncing(false);

    if (!response.ok) {
      alert(data.message || 'Cin7 refresh failed.');
      return;
    }

    alert(`Cin7 refresh complete. Products: ${data.products.created} created, ${data.products.updated} updated. Customers: ${data.customers.created} created, ${data.customers.updated} updated.`);
    window.location.reload();
  }

  if (!hasCin7) return <span className="text-xs text-slate-500">No Cin7 connection</span>;

  return (
    <div className="flex flex-wrap gap-2">
      <button className="btn-secondary px-3 py-2 text-sm" disabled={syncing} onClick={() => refresh(false)}>{syncing ? 'Refreshing...' : 'Refresh Cin7'}</button>
      <button className="btn-secondary px-3 py-2 text-sm" disabled={syncing} onClick={() => refresh(true)}>Full Refresh</button>
    </div>
  );
}
