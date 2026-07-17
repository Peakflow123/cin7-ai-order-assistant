'use client';

import { useState } from 'react';

const options = [
  { label: '1 hour', value: 60 },
  { label: '6 hours', value: 360 },
  { label: '12 hours', value: 720 },
  { label: 'Never auto logout', value: 0 }
];

export default function SessionTimeoutClient({ current }: { current: number }) {
  const [value, setValue] = useState(current);
  const [message, setMessage] = useState('');

  async function save() {
    setMessage('Saving...');
    const response = await fetch('/api/settings/session-timeout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionTimeoutMinutes: value })
    });
    const data = await response.json().catch(async () => ({ message: await response.text() }));
    setMessage(data.message || (response.ok ? 'Saved.' : 'Could not save.'));
  }

  return (
    <section className="card space-y-4">
      <div>
        <h2 className="text-xl font-black">Security Session</h2>
        <p className="page-subtitle">Choose when NexOrder AI should automatically log you out.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        {options.map((option) => (
          <label key={option.value} className={`soft-panel cursor-pointer ${value === option.value ? 'ring-4 ring-blue-100' : ''}`}>
            <input className="mr-2" type="radio" name="timeout" checked={value === option.value} onChange={() => setValue(option.value)} />
            <span className="font-bold">{option.label}</span>
          </label>
        ))}
      </div>
      <button className="btn w-full md:w-auto" onClick={save}>Save Session Setting</button>
      {message && <p className="text-sm text-slate-600">{message}</p>}
    </section>
  );
}
