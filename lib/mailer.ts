export async function sendEmail(input: { to: string; subject: string; html: string; text?: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || 'NexOrder AI <noreply@nexorderai.com>';
  if (!apiKey) throw new Error('RESEND_API_KEY is not configured');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: input.to, subject: input.subject, html: input.html, text: input.text })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Email send failed: ${response.status} ${detail.slice(0, 500)}`);
  }
  return response.json().catch(() => ({}));
}
