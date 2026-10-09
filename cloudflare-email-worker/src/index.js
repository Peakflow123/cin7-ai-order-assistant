import PostalMime from 'postal-mime';
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer); let binary = '';
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(binary);
}
export default {
  async email(message, env) {
    const parsed = await PostalMime.parse(await new Response(message.raw).arrayBuffer());
    const payload = {
      to: message.to,
      from: message.from,
      subject: parsed.subject || '',
      text: parsed.text || '',
      htmlText: parsed.html ? String(parsed.html).replace(/<[^>]+>/g, ' ') : '',
      messageId: parsed.messageId || '',
      inReplyTo: parsed.inReplyTo || '',
      references: Array.isArray(parsed.references) ? parsed.references.join(' ') : (parsed.references || ''),
      attachments: (parsed.attachments || []).slice(0, 5).map((item) => ({ filename: item.filename || 'attachment', contentType: item.mimeType || 'application/octet-stream', contentBase64: arrayBufferToBase64(item.content) }))
    };
    const response = await fetch(env.NEXORDER_INBOUND_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.INBOUND_EMAIL_SECRET}` }, body: JSON.stringify(payload) });
    if (!response.ok) throw new Error(`NexOrder rejected inbound email: ${response.status} ${await response.text()}`);
  }
};
