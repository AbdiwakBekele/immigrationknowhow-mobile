export const COMMUNITY_SECTION_LABELS: Record<string, string> = {
  feed: 'Feed',
  'ask-intro': 'Intro',
  'ask-announcement': 'Announcement',
  'immigration-legal': 'Immigration & Legal',
  'career-finance': 'Career & Finance',
  'health-wellness': 'Health & Wellness',
  'daily-living': 'Daily Living & Settling In',
  'culture-community': 'Culture & Community',
  'immigration-news': 'Latest Immigration News',
};

export function communitySectionLabel(category?: string | null): string {
  if (!category) return 'Community';
  return COMMUNITY_SECTION_LABELS[category] ?? 'Community';
}

export function formatCommunityDate(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString();
}

export function commentInitials(name?: string | null): string {
  const text = String(name ?? '').trim();
  if (!text) return 'U';
  return text
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export function youtubeThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function youtubeEmbedUrl(videoId: string, autoplay = false): string {
  const params = new URLSearchParams({
    playsinline: '1',
    rel: '0',
    modestbranding: '1',
    enablejsapi: '1',
  });
  if (autoplay) {
    params.set('autoplay', '1');
  }
  return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?${params.toString()}`;
}

/** HTML for an inline WebView player (direct .mp4 / hosted files, not YouTube). */
export function directVideoPlayerHtml(videoUrl: string, autoplay: boolean): string {
  const safeUrl = videoUrl.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  const autoplayAttr = autoplay ? 'autoplay' : '';
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #000; }
    video { width: 100%; height: 100%; object-fit: contain; background: #000; }
  </style>
</head>
<body>
  <video src="${safeUrl}" ${autoplayAttr} playsinline webkit-playsinline controls></video>
</body>
</html>`;
}

export function youtubeVideoIdFromUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.replace('/', '').slice(0, 32) || null;
    }
    if (parsed.hostname.includes('youtube.com')) {
      if (parsed.pathname === '/watch') return parsed.searchParams.get('v');
      const embed = parsed.pathname.match(/^\/embed\/([^/]+)/);
      if (embed) return embed[1] || null;
      const shorts = parsed.pathname.match(/^\/shorts\/([^/]+)/);
      if (shorts) return shorts[1] || null;
    }
  } catch {
    return null;
  }
  return null;
}
