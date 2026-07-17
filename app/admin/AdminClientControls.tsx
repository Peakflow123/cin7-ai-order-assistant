'use client';

import { useState } from 'react';

type CompanyControl = {
  id: string;
  name: string;
  isActive: boolean;
  allowClientCin7Edit: boolean;
  autoCreateEnabled: boolean;
  autoCreateThreshold: number;
  allowClientEmailReconnect: boolean;
  maxGmailConnections: number;
  maxOutlookConnections: number;
  _count: {
    users: number;
    orders: number;
    gmail: number;
    outlook: number;
    products: number;
    customers: number;
  };
};

export default function AdminClientControls({ companies }: { companies: CompanyControl[] }) {
  const [items, setItems] = useState(companies);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  function updateCompany(id: string, patch: Partial<CompanyControl>) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  async function save(company: CompanyControl) {
    setSavingId(company.id);
    setMessage('Saving client controls...');

    const response = await fetch(`/api/admin/companies/${company.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(company)
    });

    const data = await response.json().catch(async () => ({ message: await response.text() }));
    setSavingId(null);

    if (!response.ok) {
      setMessage(data.message || 'Could not save client controls.');
      return;
    }

    setMessage(`Saved ${company.name}.`);
  }

  return (
    <section className="space-y-4">
      {message && <div className="card py-4 text-sm text-slate-700">{message}</div>}

      {items.map((company) => (
        <article key={company.id} className="admin-panel space-y-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <input className="input max-w-lg text-lg font-black" value={company.name} onChange={(event) => updateCompany(company.id, { name: event.target.value })} />
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={company.isActive ? 'badge badge-green' : 'badge badge-red'}>{company.isActive ? 'Active' : 'Inactive'}</span>
                <span className="badge badge-gray">{company._count.users} users</span>
                <span className="badge badge-gray">{company._count.orders} orders</span>
                <span className="badge badge-gray">{company._count.products} products</span>
                <span className="badge badge-gray">{company._count.customers} customers</span>
              </div>
            </div>
            <button className="btn" disabled={savingId === company.id} onClick={() => save(company)}>{savingId === company.id ? 'Saving...' : 'Save Controls'}</button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <label className="soft-panel flex items-center gap-3">
              <input type="checkbox" checked={company.isActive} onChange={(event) => updateCompany(company.id, { isActive: event.target.checked })} />
              <span><b>Client active</b><br /><span className="text-sm text-slate-500">Disable access if needed.</span></span>
            </label>
            <label className="soft-panel flex items-center gap-3">
              <input type="checkbox" checked={company.autoCreateEnabled} onChange={(event) => updateCompany(company.id, { autoCreateEnabled: event.target.checked })} />
              <span><b>Auto-create Cin7</b><br /><span className="text-sm text-slate-500">Allow high-confidence automation.</span></span>
            </label>
            <label className="soft-panel flex items-center gap-3">
              <input type="checkbox" checked={company.allowClientCin7Edit} onChange={(event) => updateCompany(company.id, { allowClientCin7Edit: event.target.checked })} />
              <span><b>Client may edit Cin7</b><br /><span className="text-sm text-slate-500">Control credentials/settings access.</span></span>
            </label>
            <label className="soft-panel flex items-center gap-3">
              <input type="checkbox" checked={company.allowClientEmailReconnect} onChange={(event) => updateCompany(company.id, { allowClientEmailReconnect: event.target.checked })} />
              <span><b>Email reconnect allowed</b><br /><span className="text-sm text-slate-500">Let clients reconnect mailboxes.</span></span>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label>
              <span className="section-label">Max Gmail connections</span>
              <input className="input mt-1" type="number" min="0" value={company.maxGmailConnections} onChange={(event) => updateCompany(company.id, { maxGmailConnections: Number(event.target.value) })} />
              <p className="mt-1 text-xs text-slate-500">Currently connected: {company._count.gmail}</p>
            </label>
            <label>
              <span className="section-label">Max Outlook connections</span>
              <input className="input mt-1" type="number" min="0" value={company.maxOutlookConnections} onChange={(event) => updateCompany(company.id, { maxOutlookConnections: Number(event.target.value) })} />
              <p className="mt-1 text-xs text-slate-500">Currently connected: {company._count.outlook}</p>
            </label>
            <label>
              <span className="section-label">Auto-create threshold</span>
              <input className="input mt-1" type="number" min="0" max="1" step="0.01" value={company.autoCreateThreshold} onChange={(event) => updateCompany(company.id, { autoCreateThreshold: Number(event.target.value) })} />
              <p className="mt-1 text-xs text-slate-500">Recommended: 0.90 for launch.</p>
            </label>
          </div>
        </article>
      ))}
    </section>
  );
}
