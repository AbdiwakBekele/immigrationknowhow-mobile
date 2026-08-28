export function toAbsoluteShareUrl(shareUrl: string, baseUrl?: string): string {
  if (!shareUrl) {
    return '';
  }

  if (/^https?:\/\//i.test(shareUrl)) {
    return shareUrl;
  }

  const base = (baseUrl || '').replace(/\/+$/, '');
  const path = shareUrl.startsWith('/') ? shareUrl : `/${shareUrl}`;
  return `${base}${path}`;
}

export function buildEbookShareTargets(shareUrl: string, title: string, baseUrl?: string) {
  const absoluteUrl = toAbsoluteShareUrl(shareUrl, baseUrl);
  const encodedUrl = encodeURIComponent(absoluteUrl);
  const plainTitle = String(title || '').replace(/^"|"$/g, '').trim();
  const message = encodeURIComponent(`Check out "${plainTitle}" on IKH Library`);

  return {
    shareUrl: absoluteUrl,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${message}`,
    x: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${message}`,
  };
}
