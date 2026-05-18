const NOISE_LINE_PATTERNS = [
  /^see this story on our app/i,
  /^advertisement$/i,
  /^click here to share on social media/i,
  /^cookie preferences/i,
  /^follow al jazeera/i,
  /^©\s*\d{4}/i,
  /^source:\s*https?:\/\//i,
  /^open the menu/i,
  /^end of list$/i,
  /^list of \d+ item/i,
  /^\*{3,}\s*$/,
  /^!\[\]\(data:image/i,
  /^!\[logo\]/i,
  /^published on\b/i,
  /^share$/i,
  /^more from news/i,
  /^most popular/i,
  /^recommended stories/i,
  /^about$/i,
  /^connect$/i,
  /^our channels$/i,
  /^our network$/i,
  /^explainer$/i,
  /^sign up$/i,
  /^live$/i,
  /^by\s*\[/i,
];

const NOISE_INLINE_PATTERNS = [
  /\[view in app\]\([^)]+\)/gi,
  /al jazeera\s+see this story on our app/gi,
];

const NAV_ONLY_LINK_LINE = /^(\[[^\]]+\]\([^)]+\)\s*[|·•]\s*)*(\[[^\]]+\]\([^)]+\)\s*)+$/;

export function cleanCommunityMarkdown(source: string | null | undefined): string {
  let text = typeof source === 'string' ? source : '';
  if (!text.trim()) return '';

  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (const pattern of NOISE_INLINE_PATTERNS) {
    text = text.replace(pattern, '');
  }

  const kept: string[] = [];

  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (trimmed === '') {
      kept.push('');
      continue;
    }
    if (/^!\[[^\]]*\]\(data:image/i.test(trimmed)) continue;
    if (NOISE_LINE_PATTERNS.some((pattern) => pattern.test(trimmed))) continue;
    if (NAV_ONLY_LINK_LINE.test(trimmed) && trimmed.length < 320) continue;
    kept.push(line);
  }

  return kept.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

export function communityDescriptionPlainText(source: string | null | undefined, maxLength = 240): string {
  const cleaned = cleanCommunityMarkdown(source);
  if (!cleaned) return '';

  let plain = cleaned
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/_([^_\n]+)_/g, '$1')
    .replace(/^>\s?/gm, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (maxLength > 0 && plain.length > maxLength) {
    return `${plain.slice(0, maxLength).trimEnd()}…`;
  }
  return plain;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inlineMarkdownToHtml(line: string): string {
  const parts: string[] = [];
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(line)) !== null) {
    const before = line.slice(lastIndex, match.index);
    if (before) parts.push(escapeHtml(before));
    const url = match[2].trim();
    const href = /^https?:\/\//i.test(url) ? escapeHtml(url) : '#';
    parts.push(`<a href="${href}">${escapeHtml(match[1])}</a>`);
    lastIndex = match.index + match[0].length;
  }

  const tail = line.slice(lastIndex);
  let html = parts.join('') + (tail ? escapeHtml(tail) : '');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
  return html;
}

function blockToHtml(block: string): string {
  const trimmed = block.trim();
  if (!trimmed) return '';

  if (/^### /.test(trimmed)) {
    return `<h3>${inlineMarkdownToHtml(trimmed.replace(/^###\s+/, ''))}</h3>`;
  }
  if (/^## /.test(trimmed)) {
    return `<h2>${inlineMarkdownToHtml(trimmed.replace(/^##\s+/, ''))}</h2>`;
  }
  if (/^# /.test(trimmed)) {
    return `<h1>${inlineMarkdownToHtml(trimmed.replace(/^#\s+/, ''))}</h1>`;
  }

  const lines = trimmed.split('\n');
  if (lines.every((line) => /^>\s?/.test(line))) {
    const quote = lines.map((line) => line.replace(/^>\s?/, '')).join(' ');
    return `<blockquote><p>${inlineMarkdownToHtml(quote)}</p></blockquote>`;
  }

  if (lines.every((line) => /^[-*]\s+/.test(line))) {
    const items = lines
      .map((line) => `<li>${inlineMarkdownToHtml(line.replace(/^[-*]\s+/, ''))}</li>`)
      .join('');
    return `<ul>${items}</ul>`;
  }

  const paragraph = lines.map((line) => inlineMarkdownToHtml(line)).join('<br>');
  return `<p>${paragraph}</p>`;
}

/** HTML document for WebView post bodies. */
export function buildCommunityDescriptionDocument(source: string | null | undefined): string {
  const cleaned = cleanCommunityMarkdown(source);
  if (!cleaned) return '';

  const body = cleaned
    .split(/\n{2,}/)
    .map((block) => blockToHtml(block))
    .filter(Boolean)
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 15px; line-height: 1.6; color: #334155; margin: 0; padding: 0; }
    h1, h2, h3 { color: #0f172a; margin: 1rem 0 0.5rem; line-height: 1.3; }
    h1 { font-size: 1.35rem; }
    h2 { font-size: 1.2rem; }
    h3 { font-size: 1.05rem; }
    p { margin: 0 0 0.85rem; }
    ul { margin: 0 0 0.85rem 1.1rem; padding: 0; }
    li { margin-bottom: 0.35rem; }
    blockquote { margin: 0 0 0.85rem; padding: 0.5rem 0.75rem; border-left: 3px solid #cbd5e1; background: #f8fafc; color: #475569; }
    a { color: #2563eb; text-decoration: none; }
    strong { font-weight: 700; color: #0f172a; }
    em { font-style: italic; }
  </style>
</head>
<body>${body}</body>
</html>`;
}
