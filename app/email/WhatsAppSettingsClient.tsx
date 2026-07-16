'use client';

import { useState } from 'react';

export default function WhatsAppSettingsClient({ webhookUrl }: { webhookUrl: string }) {
  const [displayPhoneNumber, setDisplayPhoneNumber] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [businessAccountId, setBusinessAccountId] = useState('');
  const [verifyToken, setVerifyToken] = useState('nexorder-whatsapp-verify-token');
  const [accessToken, setAccessToken] = useState('');
  const [message, setMessage] = useState('');

  async function save() {
    setMessage('Saving WhatsApp settings...');
    const response = await fetch('/api/whatsapp/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayPhoneNumber, phoneNumberId, businessAccountId, verifyToken, accessToken })
    });
    setMessage(await response.text());
  }

  return (
    <section className="card space-y-4">
      <div><h2 className="text-xl font-black">WhatsApp Setup</h2><p className="text-sm text-slate-500">Connect Meta WhatsApp Cloud API webhooks for inbound customer order messages.</p></div>
      <div className="soft-panel text-sm"><p className="font-bold text-slate-700">Webhook Callback URL</p><p className="mt-1 break-all text-slate-600">{webhookUrl}</p></div>
      <div className="grid gap-3 md:grid-cols-2">
        <input className="input" placeholder="Display phone number, e.g. +15551234567" value={displayPhoneNumber} onChange={(event) => setDisplayPhoneNumber(event.target.value)} />
        <input className="input" placeholder="Meta Phone Number ID" value={phoneNumberId} onChange={(event) => setPhoneNumberId(event.target.value)} />
        <input className="input" placeholder="WhatsApp Business Account ID" value={businessAccountId} onChange={(event) => setBusinessAccountId(event.target.value)} />
        <input className="input" placeholder="Webhook verify token" value={verifyToken} onChange={(event) => setVerifyToken(event.target.value)} />
      </div>
      <textarea className="input min-h-[90px]" placeholder="Permanent or system user access token, optional for inbound text-only first phase" value={accessToken} onChange={(event) => setAccessToken(event.target.value)} />
      <button className="btn" onClick={save}>Save WhatsApp Connection</button>
      {message && <p className="text-sm text-slate-600">{message}</p>}
      <div className="soft-panel text-sm text-slate-600"><b>Next in Meta:</b> Add the webhook URL above, use the same verify token, and subscribe to messages events.</div>
    </section>
  );
}
