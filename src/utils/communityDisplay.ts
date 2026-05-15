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
