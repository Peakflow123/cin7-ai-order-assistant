function imageMimeType(filename: string, mimeType: string) {
  const lowerName = filename.toLowerCase();
  const lowerMime = mimeType.toLowerCase();
  if (lowerMime.startsWith('image/')) return lowerMime;
  if (lowerName.endsWith('.png')) return 'image/png';
  if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) return 'image/jpeg';
  if (lowerName.endsWith('.webp')) return 'image/webp';
  if (lowerName.endsWith('.gif')) return 'image/gif';
  return '';
}

export function isSupportedOcrImage(filename: string, mimeType: string) {
  const mime = imageMimeType(filename, mimeType);
  return ['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(mime);
}

function normalizeGroqVisionModel(model: string) {
  const trimmed = model.trim();
  const deprecated = new Set([
    'llama-3.2-90b-vision-preview',
    'llama-3.2-11b-vision-preview',
    'llava-v1.5-7b-4096-preview'
  ]);
  if (!trimmed || deprecated.has(trimmed)) return 'qwen/qwen3.6-27b';
  return trimmed;
}

export async function extractTextFromImageBuffer(input: { filename: string; mimeType: string; buffer: Buffer }) {
  const mime = imageMimeType(input.filename, input.mimeType);
  if (!mime || !isSupportedOcrImage(input.filename, input.mimeType)) {
    return `[Unsupported image OCR type: ${input.filename}]`;
  }

  const apiKey = process.env.GROQ_API_KEY || '';
  if (!apiKey) {
    return `[Image attachment found but OCR is not configured: ${input.filename}]`;
  }

  const model = normalizeGroqVisionModel(process.env.GROQ_VISION_MODEL || 'qwen/qwen3.6-27b');
  const base64 = input.buffer.toString('base64');
  const dataUrl = `data:${mime};base64,${base64}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        max_completion_tokens: 1800,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all readable text from this image for order processing. Preserve product names, SKUs, quantities, PO numbers, customer names, addresses, dates, prices, currency, delivery notes and any table-like structure. Return only extracted text and no commentary. If no useful text is visible, say: No readable text found.'
              },
              {
                type: 'image_url',
                image_url: { url: dataUrl }
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();
    if (!response.ok) {
      const message = JSON.stringify(data).slice(0, 500);
      return `[Could not OCR image ${input.filename}: ${message}]`;
    }

    const text = String(data?.choices?.[0]?.message?.content || '').trim();
    return text ? text.slice(0, 8000) : `[No readable text found in image: ${input.filename}]`;
  } catch (error) {
    return `[Could not OCR image ${input.filename}: ${error instanceof Error ? error.message : 'unknown error'}]`;
  }
}
