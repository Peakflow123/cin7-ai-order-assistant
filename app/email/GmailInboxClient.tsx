'use client';

import { useState } from 'react';

type GmailConnection = {
  id: string;
  email: string | null;
  isActive: boolean;
};

type GmailMessage = {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
  hasAttachments: boolean;
  attachmentNames: string[];
  alreadyProcessed: boolean;
  orderId: string | null;
};

export default function GmailInboxClient({ connections }: { connections: GmailConnection[] }) {
  const [selectedConnectionId, setSelectedConnectionId] = useState(connections[0]?.id || '');
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  async function loadInbox() {
    if (!selectedConnectionId) return;
    setLoading(true);
    setStatus('Loading recent Gmail messages...');

    const response = await fetch(`/api/gmail/inbox?connectionId=${selectedConnectionId}&maxResults=10`);
    const data = await response.json();

    if (!response.ok) {
      setStatus(data.message || 'Could not load Gmail inbox.');
      setLoading(false);
      return;
    }

    setMessages(data.messages || []);
    setStatus(`Loaded ${(data.messages || []).length} recent Gmail messages.`);
    setLoading(false);
  }

  async function processMessage(messageId: string) {
    setProcessingId(messageId);
    setStatus('Processing Gmail message with AI...');

    const response = await fetch('/api/gmail/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectionId: selectedConnectionId, messageId })
    });

    const data = await response.json();
    setProcessingId(null);

    if (!response.ok) {
      setStatus(data.message || 'Could not process Gmail message.');
      return;
    }

    setStatus(data.message || 'Gmail message processed.');

    if (data.orderId) {
      window.location.href = `/orders/${data.orderId}`;
    }
  }

  if (connections.length === 0) {
    return null;
  }

  return (
    <section className="card space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold">Gmail Inbox Test</h2>
          <p className="text-sm text-slate-500">Read recent emails and convert selected email into a NexOrder AI review order.</p>
        </div>
        <div className="flex flex-col gap-2 md:flex-row">
          <select className="input md:w-80" value={selectedConnectionId} onChange={(event) => setSelectedConnectionId(event.target.value)}>
            {connections.map((connection) => (
              <option key={connection.id} value={connection.id}>{connection.email || 'Connected Gmail mailbox'}</option>
            ))}
          </select>
          <button className="btn" disabled={loading || !selectedConnectionId} onClick={loadInbox}>
            {loading ? 'Loading...' : 'Load Recent Emails'}
          </button>
        </div>
      </div>

      {status && <p className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">{status}</p>}

      <div className="space-y-3">
        {messages.map((message) => (
          <div key={message.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <p className="font-semibold text-slate-950">{message.subject}</p>
                <p className="text-sm text-slate-500">From: {message.from}</p>
                <p className="text-sm text-slate-500">Date: {message.date}</p>
                <p className="mt-2 text-sm text-slate-700">{message.snippet}</p>
                {message.hasAttachments && <p className="mt-2 text-xs text-slate-500">Attachments: {message.attachmentNames.join(', ')}</p>}
                {message.alreadyProcessed && <p className="mt-2 text-xs font-semibold text-emerald-700">Already processed</p>}
              </div>
              <button
                className="btn-secondary shrink-0"
                disabled={processingId === message.id || message.alreadyProcessed}
                onClick={() => processMessage(message.id)}
              >
                {message.alreadyProcessed ? 'Processed' : processingId === message.id ? 'Processing...' : 'Process Email'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
