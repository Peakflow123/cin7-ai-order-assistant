function sanitizeText(value: string, max = 12000) {
  return value.replace(/\u0000/g, '').replace(/\s+\n/g, '\n').trim().slice(0, max);
}

export async function parseAttachmentBuffer(filename: string, mimeType: string, buffer: Buffer) {
  const lowerName = filename.toLowerCase();
  const lowerMime = mimeType.toLowerCase();

  try {
    if (lowerMime.includes('pdf') || lowerName.endsWith('.pdf')) {
      const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;
      const parsed = await pdfParse(buffer);
      return sanitizeText(parsed.text || '', 9000);
    }

    if (lowerName.endsWith('.docx') || lowerMime.includes('wordprocessingml')) {
      const mammoth = await import('mammoth');
      const parsed = await mammoth.extractRawText({ buffer });
      return sanitizeText(parsed.value || '', 9000);
    }

    if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls') || lowerMime.includes('spreadsheet')) {
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const parts: string[] = [];
      for (const sheetName of workbook.SheetNames.slice(0, 3)) {
        const sheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        parts.push(`Sheet: ${sheetName}\n${csv}`);
      }
      return sanitizeText(parts.join('\n\n'), 10000);
    }

    if (lowerName.endsWith('.txt') || lowerName.endsWith('.csv') || lowerMime.startsWith('text/')) {
      return sanitizeText(buffer.toString('utf8'), 9000);
    }

    if (lowerMime.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.webp'].some((ext) => lowerName.endsWith(ext))) {
      return `[Image attachment found but OCR is not enabled yet: ${filename}]`;
    }
  } catch (error) {
    return `[Could not parse attachment ${filename}: ${error instanceof Error ? error.message : 'unknown error'}]`;
  }

  return `[Unsupported attachment type: ${filename} (${mimeType || 'unknown mime type'})]`;
}
