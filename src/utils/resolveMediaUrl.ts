import { BASE_URL } from '../config/api';

/** Turn relative API paths (e.g. `/storage/...`) into absolute URLs for image loaders. */
export function resolveMediaUrl(uri: string | null | undefined): string | null {
  const t = typeof uri === 'string' ? uri.trim() : '';
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  if (t.startsWith('//')) return `https:${t}`;
  if (t.startsWith('/')) {
    const base = BASE_URL.replace(/\/$/, '');
    return `${base}${t}`;
  }
  return t;
}
