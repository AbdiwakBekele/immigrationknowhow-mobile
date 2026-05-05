import type { ApiError } from './types';

/** Prefer field validation lines (e.g. auth.failed); fall back to `message`. */
export function friendlyApiErrorMessage(err: ApiError): string {
  const msg = typeof err.message === 'string' ? err.message.trim() : '';
  if (err.errors && typeof err.errors === 'object') {
    const lines: string[] = [];
    for (const v of Object.values(err.errors)) {
      const arr = Array.isArray(v) ? v : [v];
      for (const s of arr) {
        const t = String(s).trim();
        if (t) lines.push(t);
      }
    }
    if (lines.length) return lines.join('\n');
  }
  return msg || 'Something went wrong';
}
