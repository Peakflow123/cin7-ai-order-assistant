'use client';

import { useState } from 'react';

export default function ClientLifecycleButtons({ companyId, companyName, isActive, isArchived }: { companyId: string; companyName: string; isActive: boolean; isArchived: boolean }) {
  const [busy, setBusy] = useState(false);

  async function postAction(action: string) {
    setBusy(true);
    const response = await fetch(`/api/admin/companies/${companyId}/lifecycle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });
    if (!response.ok) alert(await response.text());
    window.location.reload();
  }

  async function permanentDelete() {
    const confirm = window.prompt(`Permanent delete ${companyName}? This deletes users, orders, customers, products, aliases and connections. Type DELETE to confirm.`);
    if (confirm !== 'DELETE') return;

    setBusy(true);
    const response = await fetch(`/api/admin/companies/${companyId}/lifecycle`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm })
    });
    if (!response.ok) {
      alert(await response.text());
      setBusy(false);
      return;
    }
    window.location.reload();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {isActive ? <button className="btn-secondary px-3 py-2 text-sm" disabled={busy} onClick={() => postAction('deactivate')}>Deactivate</button> : <button className="btn-success px-3 py-2 text-sm" disabled={busy} onClick={() => postAction('reactivate')}>Reactivate</button>}
      {isArchived ? <button className="btn-secondary px-3 py-2 text-sm" disabled={busy} onClick={() => postAction('unarchive')}>Unarchive</button> : <button className="btn-secondary px-3 py-2 text-sm" disabled={busy} onClick={() => postAction('archive')}>Archive</button>}
      <button className="btn-danger px-3 py-2 text-sm" disabled={busy} onClick={permanentDelete}>Delete Permanently</button>
    </div>
  );
}
