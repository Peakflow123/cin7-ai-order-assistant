'use client';

import { useState } from 'react';

export default function Register() {
  const [form, setForm] = useState({ companyName: '', name: '', email: '', password: '' });
  const [message, setMessage] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch('/api/auth/register', { method: 'POST', body: JSON.stringify(form) });
    if (response.ok) window.location.href = '/dashboard';
    else setMessage(await response.text());
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={submit} className="card w-full max-w-md space-y-3">
        <h1 className="text-2xl font-bold">Create account</h1>
        <input className="input" placeholder="Company name" onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
        <input className="input" placeholder="Your name" onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="input" placeholder="Email" onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="input" type="password" placeholder="Password" onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button className="btn w-full">Register</button>
        <p className="text-red-600">{message}</p>
      </form>
    </main>
  );
}
