'use client';

import { useMemo, useState } from 'react';

type GmailConnection = { id: string; email: string | null; isActive: boolean };
type GmailMessage = {
  id: string;
  threadId?: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
  hasAttachments: boolean;
  attachmentNames: string[];
  alreadyProcessed: boolean;
  orderId: string | null;
  classification: { category: 'ORDER' | 'NOT_ORDER' | 'UNCLEAR'; confidence: number; reason: string };
};

function badgeClass(category: string) {
  if (category === 'ORDER') return 'badge badge-green';
  if (category === 'NOT_ORDER') return 'badge badge-gray';
  return 'badge badge-yellow';
}

function parseMessageDate(value: string) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

export default function GmailInboxClient({ connections }: { connections: GmailConnection[] }) {
  const [selectedConnectionId, setSelectedConnectionId] = useState(connections[0]?.id || '');
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [includeNonOrders, setIncludeNonOrders] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [maxResults, setMaxResults] = useState(50);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const filteredMessages = useMemo(() => {
    return messages.filter((message) => {
      const date = parseMessageDate(message.date);
      if (fromDate && date && date < new Date(`${fromDate}T00:00:00`)) return false;
      if (toDate && date && date > new Date(`${toDate}T23:59:59`)) return false;
      return true;
    });
  }, [messages, fromDate, toDate]);

  async function loadInbox() {
    if (!selectedConnectionId) return;
    setLoading(true);
    setStatus('Loading Gmail messages with lightweight AI classification...');

    const params = new URLSearchParams({
      connectionId: selectedConnectionId,
      maxResults: String(maxResults),
      includeNonOrders: String(includeNonOrders)
    });
    if (fromDate) params.set('fromDate', fromDate);
    if (toDate) params.set('toDate', toDate);

    const response = await fetch(`/api/gmail/inbox?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      setStatus(data.message || 'Could not load Gmail inbox.');
      setLoading(false);
      return;
    }

    setMessages(data.messages || []);
    setStatus(`Loaded ${(data.messages || []).length} Gmail messages. Attachments are read only when you click Process Email.`);
    setLoading(false);
  }

  async function processMessage(messageId: string, force = false) {
    setProcessingId(messageId);
    setStatus('Processing full email and supported attachments with AI...');

    const response = await fetch('/api/gmail/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectionId: selectedConnectionId, messageId, force })
    });

    const data = await response.json();
    setProcessingId(null);

    if (!response.ok) {
      setStatus(data.message || 'Could not process Gmail message.');
      return;
    }

    if (data.alreadyProcessed) {
      setStatus(data.message || 'This Gmail message/conversation has already been processed.');
      await loadInbox();
      return;
    }

    if (data.orderId) {
      window.location.href = `/orders/${data.orderId}`;
      return;
    }

    setStatus(data.message || 'Gmail message processed.');
    await loadInbox();
  }

  if (connections.length === 0) return null;

  return (
    <section className="card space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold">Gmail Inbox Automation Test</h2>
          <p className="text-sm text-slate-500">Load up to 100 Gmail messages, filter by date, and prevent duplicate processing.</p>
        </div>
        <div className="flex flex-col gap-2 md:flex-row">
          <select className="input md:w-80" value={selectedConnectionId} onChange={(event) => setSelectedConnectionId(event.target.value)}>
            {connections.map((connection) => <option key={connection.id} value={connection.id}>{connection.email || 'Connected Gmail mailbox'}</option>)}
          </select>
          <button className="btn" disabled={loading || !selectedConnectionId} onClick={loadInbox}>{loading ? 'Loading...' : 'Load Gmail Emails'}</button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <label className="text-sm font-bold text-slate-700">Load
          <select className="input mt-1" value={maxResults} onChange={(event) => setMaxResults(Number(event.target.value))}>
            <option value={25}>Last 25 emails</option>
            <option value={50}>Last 50 emails</option>
            <option value={100}>Last 100 emails</option>
          </select>
        </label>
        <label className="text-sm font-bold text-slate-700">From date<input className="input mt-1" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /></label>
        <label className="text-sm font-bold text-slate-700">To date<input className="input mt-1" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} /></label>
        <label className="mt-7 flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={includeNonOrders} onChange={(event) => setIncludeNonOrders(event.target.checked)} /> Include emails AI thinks are not orders</label>
      </div>

      {status && <p className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">{status}</p>}

      <div className="space-y-3">
        {filteredMessages.map((message) => (
          <div key={message.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className={badgeClass(message.classification.category)}>{message.classification.category}</span>
                  <span className="badge badge-gray">{Math.round(message.classification.confidence * 100)}%</span>
                  {message.alreadyProcessed && <span className="badge badge-green">Processed</span>}
                </div>
                <p className="font-semibold text-slate-950">{message.subject}</p>
                <p className="text-sm text-slate-500">From: {message.from}</p>
                <p className="text-sm text-slate-500">Date: {message.date}</p>
                <p className="mt-2 text-sm text-slate-700">{message.snippet}</p>
                <p className="mt-2 text-xs text-slate-500">AI reason: {message.classification.reason}</p>
                {message.hasAttachments && <p className="mt-2 text-xs text-slate-500">Attachments: {message.attachmentNames.join(', ')}</p>}
              </div>
              <div className="flex shrink-0 flex-col gap-2">
                <button className="btn-secondary" disabled={processingId === message.id || message.alreadyProcessed || message.classification.category === 'NOT_ORDER'} onClick={() => processMessage(message.id)}>
                  {message.alreadyProcessed ? 'Processed' : processingId === message.id ? 'Processing...' : 'Process Email'}
                </button>
                {message.classification.category === 'NOT_ORDER' && !message.alreadyProcessed && (
                  <button className="btn-secondary" disabled={processingId === message.id} onClick={() => processMessage(message.id, true)}>Process Anyway</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
