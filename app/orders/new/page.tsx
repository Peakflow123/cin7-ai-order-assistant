'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function NewOrder() {
  const [text, setText] = useState('');
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  async function process() {
    try {
      setIsProcessing(true);
      setMessage('Processing order...');

      const response = await fetch('/api/orders/process-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, source: 'manual-email' })
      });

      const responseText = await response.text();
      if (!response.ok) {
        setMessage(`Error: ${responseText}`);
        return;
      }

      const result = JSON.parse(responseText);
      window.location.href = `/orders/${result.id}`;
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <main className="page-shell space-y-6">
      <div>
        <Link href="/dashboard" className="text-sm font-semibold text-slate-500 hover:text-slate-950">← Back to Dashboard</Link>
        <h1 className="page-title mt-2">Test Email Order</h1>
        <p className="page-subtitle">Paste an order email. AI will extract customer, PO, products, quantities, and packaging context for SKU matching.</p>
      </div>

      <section className="card space-y-4">
        <textarea
          className="input min-h-[320px]"
          placeholder="Example:\nCustomer: Adil\n10 boxes of BBQ grill utensil set\nCustomer PO #12345"
          value={text}
          onChange={(event) => setText(event.target.value)}
        />

        <div className="flex items-center gap-3">
          <button className="btn" onClick={process} disabled={isProcessing || !text.trim()}>
            {isProcessing ? 'Processing...' : 'Extract Order'}
          </button>
          <Link className="btn-secondary" href="/orders">Cancel</Link>
        </div>

        {message && <p className="whitespace-pre-wrap text-sm text-slate-600">{message}</p>}
      </section>
    </main>
  );
}
