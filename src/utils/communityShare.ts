import { BASE_URL } from '../config/api';

export function communityPostSharePath(id: number): string {
  return `/community/${id}`;
}

export function communityPostShareUrl(id: number): string {
  const base = BASE_URL.replace(/\/+$/, '');
  return `${base}${communityPostSharePath(id)}`;
}

export function buildCommunityShareTargets(postId: number, postTitle: string) {
  const shareUrl = communityPostShareUrl(postId);
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(postTitle || '');
  const whatsappText = encodeURIComponent(`${postTitle || 'Community post'}\n${shareUrl}`);

  return {
    shareUrl,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    x: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${whatsappText}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
  };
}
