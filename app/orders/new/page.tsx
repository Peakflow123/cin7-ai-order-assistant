'use client';

import { useState } from 'react';

export default function NewOrder() {
  const [text, setText] = useState('');
  const [message, setMessage] = useState('');

  async function process() {
    setMessage('Processing...');
    const response = await fetch('/api/orders/process-email', {
      method: 'POST',
      body: JSON.stringify({ text, source: 'manual-email' })
    });
    const result = await response.json();
    if (response.ok) window.location.href = `/orders/${result.id}`;
    else setMessage(JSON.stringify(result));
  }

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <div className="card space-y-3">
        <h1 className="text-2xl font-bold">Test Email Order</h1>
        <textarea className="input h-72" placeholder="Paste order email text here..." onChange={(e) => setText(e.target.value)} />
        <button className="btn" onClick={process}>AI Extract & Match</button>
        <p>{message}</p>
      </div>
    </main>
  );
}
