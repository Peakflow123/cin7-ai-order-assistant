'use client';

import { useState } from 'react';

export default function AdminCin7SyncButton({ companyId, hasCin7 }: { companyId: string; hasCin7: boolean }) {
  const [syncing, setSyncing] = useState(false);

  async function postJson(url: string, body: any) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const text = await response.text();
    let data: any = {};
    try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
    if (!response.ok) throw new Error(data.message || 'Cin7 Core refresh failed.');
    return data;
  }

  async function refreshEntity(entity: 'Product' | 'Customer', totals: any) {
    for (let page = 1; page <= 100; page += 1) {
      const data = await postJson(`/api/admin/companies/${companyId}/cin7-refresh-step`, { entity, page, since: null });
      if (entity === 'Product') {
        totals.productsCreated += data.created || 0;
        totals.productsUpdated += data.updated || 0;
        totals.productsSkipped += data.skipped || 0;
      } else {
        totals.customersCreated += data.created || 0;
        totals.customersUpdated += data.updated || 0;
        totals.customersSkipped += data.skipped || 0;
      }
      if (data.done) break;
    }
  }

  async function refresh() {
    setSyncing(true);
    const totals = { productsCreated: 0, productsUpdated: 0, productsSkipped: 0, customersCreated: 0, customersUpdated: 0, customersSkipped: 0 };
    try {
      await refreshEntity('Product', totals);
      await refreshEntity('Customer', totals);
      const complete = await postJson(`/api/admin/companies/${companyId}/cin7-refresh-complete`, totals);
      alert(complete.message || 'Cin7 Core refresh completed.');
      window.location.reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Cin7 Core refresh failed.');
    } finally {
      setSyncing(false);
    }
  }

  if (!hasCin7) return <span className="text-xs text-slate-500">No Cin7 connection</span>;
  return <button className="btn-secondary px-3 py-2 text-sm" disabled={syncing} onClick={refresh}>{syncing ? 'Refreshing...' : 'Refresh Products & Customers'}</button>;
}
