import type { ApiError } from './types';

function formatKilobyteLimit(kb: number): string {
  if (kb >= 1024 && kb % 1024 === 0) return `${kb / 1024} MB`;
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${kb} KB`;
}

/** Rewrites Laravel default avatar validation copy into user-facing upload language. */
export function humanizeValidationMessage(text: string): string {
  let line = text.trim();
  if (!line) return line;

  const maxKbMatch = line.match(/^the avatar field must not be greater than (\d+) kilobytes\.?$/i);
  if (maxKbMatch) {
    return `Uploaded image must not be greater than ${formatKilobyteLimit(Number(maxKbMatch[1]))}.`;
  }

  if (/^the avatar field is required\.?$/i.test(line)) {
    return 'Please choose an image to upload.';
  }

  const mimeMatch = line.match(/^the (?:avatar|image) field must be a file of type:?\s*(.+)\.?$/i);
  if (mimeMatch) {
    return `Uploaded image must be a ${mimeMatch[1].trim()} file.`;
  }

  line = line.replace(/\b(?:avatar|image) field\b/gi, 'uploaded image');
  line = line.replace(/^the (?:avatar|image)\b/gi, 'The uploaded image');
  line = line.replace(/^the uploaded image must be an image\.?$/i, 'Please choose a JPEG, PNG, GIF, WebP, or HEIC image.');
  return line;
}

/** Prefer field validation lines (e.g. auth.failed); fall back to `message`. */
export function friendlyApiErrorMessage(err: ApiError): string {
  const msg = typeof err.message === 'string' ? err.message.trim() : '';
  if (err.errors && typeof err.errors === 'object') {
    const lines: string[] = [];
    for (const v of Object.values(err.errors)) {
      const arr = Array.isArray(v) ? v : [v];
      for (const s of arr) {
        const t = humanizeValidationMessage(String(s));
        if (t) lines.push(t);
      }
    }
    if (lines.length) return lines.join('\n');
  }
  return humanizeValidationMessage(msg) || 'Something went wrong';
}
