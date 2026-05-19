import { apiClient, normalizeApiError } from './client';
import type { ApiResponse } from './types';

const PREFIX = '/api/mobile/community';

export type CommunityPostPayload = {
  id: number;
  title: string;
  description?: string | null;
  tag?: string | null;
  category?: string | null;
  image_url?: string | null;
  video_url?: string | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  bookmarks_count: number;
  user_reactions: string[];
  created_at?: string | null;
};

export type CommunityCommentPayload = {
  id: number;
  author_name: string;
  author_avatar_url?: string | null;
  content: string;
  created_at?: string | null;
};

export type CommunityNewsItem = {
  id: string;
  title: string;
  url: string;
  published_at?: string;
  source: string;
  summary: string;
  image?: string | null;
};

export type CommunityPostsPage = {
  data: CommunityPostPayload[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  next_page_url: string | null;
};

export async function listCommunityPosts(
  params: Record<string, unknown> = {},
): Promise<ApiResponse<{ posts: CommunityPostsPage }>> {
  try {
    const res = await apiClient.get(`${PREFIX}/posts`, { params });
    const raw = res.data?.posts;
    const posts: CommunityPostsPage = {
      data: Array.isArray(raw?.data) ? raw.data : [],
      current_page: Number(raw?.current_page ?? 1),
      last_page: Number(raw?.last_page ?? 1),
      per_page: Number(raw?.per_page ?? 20),
      total: Number(raw?.total ?? 0),
      next_page_url: typeof raw?.next_page_url === 'string' ? raw.next_page_url : null,
    };
    return { success: true, message: 'OK', data: { posts } };
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function getCommunityPost(id: number): Promise<ApiResponse<{ post: CommunityPostPayload }>> {
  try {
    const res = await apiClient.get(`${PREFIX}/posts/${id}`);
    return { success: true, message: 'OK', data: { post: res.data?.post } };
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function getCommunityComments(postId: number): Promise<ApiResponse<{ comments: CommunityCommentPayload[] }>> {
  try {
    const res = await apiClient.get(`${PREFIX}/posts/${postId}/comments`);
    return { success: true, message: 'OK', data: { comments: res.data?.comments ?? [] } };
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function getCommunityNews(params: { country?: string; limit?: number } = {}): Promise<
  ApiResponse<{ country: string; items: CommunityNewsItem[]; error?: string }>
> {
  try {
    const res = await apiClient.get(`${PREFIX}/news`, { params });
    return {
      success: true,
      message: 'OK',
      data: {
        country: res.data?.country ?? 'US',
        items: res.data?.items ?? [],
        error: res.data?.error,
      },
    };
  } catch (e) {
    return normalizeApiError(e);
  }
}

export type ReactResponse = {
  success: boolean;
  type: string;
  active: boolean;
  counts: {
    likes_count: number;
    shares_count: number;
    bookmarks_count: number;
    comments_count: number;
  };
};

export async function reactToCommunityPost(postId: number, type: 'like' | 'share' | 'bookmark'): Promise<ApiResponse<ReactResponse>> {
  try {
    const res = await apiClient.post(`${PREFIX}/posts/${postId}/react`, { type });
    return { success: true, message: 'OK', data: res.data };
  } catch (e) {
    return normalizeApiError(e);
  }
}

export async function addCommunityComment(postId: number, content: string): Promise<
  ApiResponse<{
    success: boolean;
    comment: CommunityCommentPayload;
    counts: { comments_count: number };
  }>
> {
  try {
    const res = await apiClient.post(`${PREFIX}/posts/${postId}/comments`, { content });
    return { success: true, message: 'OK', data: res.data };
  } catch (e) {
    return normalizeApiError(e);
  }
}
