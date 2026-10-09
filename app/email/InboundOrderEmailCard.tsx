'use client';
import { useState } from 'react';

export default function InboundOrderEmailCard({ address, enabled }: { address: string; enabled: boolean }) {
  const [copied, setCopied] = useState(false);
  const [currentAddress, setCurrentAddress] = useState(address);
  const [working, setWorking] = useState(false);
  async function copyAddress() {
    await navigator.clipboard.writeText(currentAddress);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }
  async function regenerate() {
    if (!window.confirm('Regenerate this address? The old address will stop working immediately.')) return;
    setWorking(true);
    const response = await fetch('/api/inbound-email/regenerate', { method: 'POST' });
    const data = await response.json();
    setWorking(false);
    if (response.ok && data.address) setCurrentAddress(data.address);
    else window.alert(data.message || 'Could not regenerate the address.');
  }
  return (
    <section className="card space-y-4 border-blue-200 bg-blue-50/40">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <span className="badge badge-blue">Recommended</span>
          <h2 className="mt-3 text-2xl font-black">Your NexOrder order address</h2>
          <p className="mt-1 text-sm text-slate-600">Forward customer order emails and attachments to this private address. NexOrder processes them automatically.</p>
        </div>
        <span className={enabled ? 'badge badge-green' : 'badge badge-red'}>{enabled ? 'Active' : 'Disabled'}</span>
      </div>
      <div className="rounded-2xl border border-blue-200 bg-white p-4">
        <p className="break-all font-mono text-base font-bold text-blue-800">{currentAddress}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button className="btn" type="button" onClick={copyAddress}>{copied ? 'Copied' : 'Copy Address'}</button>
        <button className="btn-secondary" type="button" disabled={working} onClick={regenerate}>{working ? 'Regenerating...' : 'Regenerate Address'}</button>
      </div>
      <div className="soft-panel text-sm text-slate-600">
        <p className="font-bold text-slate-800">How to use it</p>
        <p className="mt-1">Create a forwarding rule in Gmail or Outlook, or manually forward an order to this address. Only messages sent to this unique address are processed.</p>
      </div>
    </section>
  );
}
