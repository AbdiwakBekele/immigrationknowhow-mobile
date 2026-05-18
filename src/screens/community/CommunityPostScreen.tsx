import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { AppScreen } from '../../components/AppScreen';
import { AppImage } from '../../components/AppImage';
import { CommunityCommentRow } from '../../components/community/CommunityCommentRow';
import { CommunityEngagementBar } from '../../components/community/CommunityEngagementBar';
import { CommunityPostSharePanel } from '../../components/community/CommunityPostSharePanel';
import { CommunityShareSheet } from '../../components/community/CommunityShareSheet';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { shadows } from '../../theme/shadows';
import * as communityApi from '../../api/communityApi';
import type { CommunityCommentPayload, CommunityPostPayload } from '../../api/communityApi';
import type { CommunityStackParamList } from './CommunityStack';
import { communitySectionLabel, formatCommunityDate, youtubeVideoIdFromUrl } from '../../utils/communityDisplay';
import { resolveMediaUrl } from '../../utils/resolveMediaUrl';
import { buildCommunityDescriptionDocument } from '../../utils/communityContent';

function mergeReactions(prev: string[] | undefined, type: 'like' | 'share' | 'bookmark', active: boolean): string[] {
  const set = new Set(prev ?? []);
  if (type === 'share') {
    if (active) set.add('share');
    return [...set];
  }
  if (active) set.add(type);
  else set.delete(type);
  return [...set];
}

export function CommunityPostScreen() {
  const route = useRoute<RouteProp<CommunityStackParamList, 'CommunityPost'>>();
  const { id, focusComments } = route.params;
  const scrollRef = useRef<ScrollView>(null);
  const commentsOffsetRef = useRef(0);
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<CommunityPostPayload | null>(null);
  const [comments, setComments] = useState<CommunityCommentPayload[]>([]);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reacting, setReacting] = useState<string | null>(null);
  const [descriptionWebViewHeight, setDescriptionWebViewHeight] = useState(160);

  const load = async () => {
    setLoading(true);
    const [postRes, commentsRes] = await Promise.all([communityApi.getCommunityPost(id), communityApi.getCommunityComments(id)]);
    setLoading(false);
    if (postRes.success && postRes.data.post) {
      setPost(postRes.data.post);
      setDescriptionWebViewHeight(160);
    }
    if (commentsRes.success) setComments(commentsRes.data.comments ?? []);
  };

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [id])
  );

  useFocusEffect(
    useCallback(() => {
      if (!focusComments || loading) return;
      const timer = setTimeout(() => {
        scrollRef.current?.scrollTo({ y: Math.max(commentsOffsetRef.current - spacing.lg, 0), animated: true });
      }, 250);
      return () => clearTimeout(timer);
    }, [focusComments, loading])
  );

  const applyCounts = (counts: { likes_count: number; shares_count: number; bookmarks_count: number; comments_count: number }) => {
    setPost((p) =>
      p
        ? {
            ...p,
            likes_count: counts.likes_count,
            shares_count: counts.shares_count,
            bookmarks_count: counts.bookmarks_count,
            comments_count: counts.comments_count,
          }
        : p
    );
  };

  const onReact = async (type: 'like' | 'share' | 'bookmark') => {
    if (!post || reacting) return;
    setReacting(type);
    const res = await communityApi.reactToCommunityPost(id, type);
    setReacting(null);
    if (!res.success) {
      Alert.alert('Could not update', res.message);
      return;
    }
    const data = res.data;
    if (data?.counts) applyCounts(data.counts);
    if (data && typeof data.active === 'boolean') {
      setPost((p) =>
        p
          ? {
              ...p,
              user_reactions: mergeReactions(p.user_reactions, type, data.active),
            }
          : p
      );
    }
  };

  const recordShare = async () => {
    const res = await communityApi.reactToCommunityPost(id, 'share');
    if (!res.success) return;
    if (res.data?.counts) applyCounts(res.data.counts);
    if (res.data && typeof res.data.active === 'boolean') {
      setPost((p) =>
        p
          ? {
              ...p,
              user_reactions: mergeReactions(p.user_reactions, 'share', res.data.active),
            }
          : p
      );
    }
  };

  const onSubmitComment = async () => {
    const content = commentText.trim();
    if (!content || submitting) return;
    setSubmitting(true);
    setCommentError(null);
    const res = await communityApi.addCommunityComment(id, content);
    setSubmitting(false);
    if (!res.success) {
      setCommentError(res.message);
      return;
    }
    if (res.data.comment) setComments((c) => [res.data.comment, ...c]);
    setCommentText('');
    if (res.data.counts?.comments_count != null) {
      setPost((p) => (p ? { ...p, comments_count: res.data.counts.comments_count } : p));
    }
  };

  if (loading) {
    return (
      <AppScreen style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
      </AppScreen>
    );
  }

  if (!post) {
    return (
      <AppScreen style={styles.centered}>
        <Text style={styles.errorText}>This post could not be found.</Text>
      </AppScreen>
    );
  }

  const reactions = post.user_reactions ?? [];
  const liked = reactions.includes('like');
  const bookmarked = reactions.includes('bookmark');
  const youtubeId = youtubeVideoIdFromUrl(post.video_url);
  const publishedAt = formatCommunityDate(post.created_at);

  return (
    <AppScreen style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.article}>
            <View style={styles.headerBand}>
              <View style={styles.categoryPill}>
                <Text style={styles.categoryPillText}>
                  {communitySectionLabel(post.category)}
                  {post.tag ? ` · ${post.tag}` : ''}
                </Text>
              </View>
              <Text style={styles.title}>{post.title}</Text>
              {!!publishedAt && <Text style={styles.timestamp}>{publishedAt}</Text>}
            </View>

            <View style={styles.articleBody}>
              {!!post.image_url && (
                <AppImage uri={resolveMediaUrl(post.image_url)} height={240} style={styles.heroImage} contentFit="cover" />
              )}

              {!!post.video_url && !youtubeId && (
                <Pressable onPress={() => void Linking.openURL(post.video_url!)} style={styles.videoLink} accessibilityRole="link">
                  <Text style={styles.videoLinkText}>Open video</Text>
                </Pressable>
              )}

          {!!post?.description && (
            <WebView
              originWhitelist={['*']}
              source={{ html: buildCommunityDescriptionDocument(post.description) }}
              style={[styles.descriptionWebView, { height: descriptionWebViewHeight }]}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              onMessage={(event) => {
                const height = Number(event.nativeEvent.data);
                if (Number.isFinite(height) && height > 0) {
                  setDescriptionWebViewHeight(Math.min(Math.max(height, 80), 2400));
                }
              }}
              injectedJavaScript={`
                setTimeout(function () {
                  window.ReactNativeWebView.postMessage(String(document.body.scrollHeight));
                }, 120);
                true;
              `}
            />
          )}

              {!!post.description && <Text style={styles.body}>{post.description}</Text>}

              <CommunityEngagementBar
                liked={liked}
                bookmarked={bookmarked}
                likes={post.likes_count ?? 0}
                comments={post.comments_count ?? comments.length}
                shares={post.shares_count ?? 0}
                bookmarks={post.bookmarks_count ?? 0}
                onLike={() => void onReact('like')}
                onComment={() => scrollRef.current?.scrollTo({ y: Math.max(commentsOffsetRef.current - spacing.lg, 0), animated: true })}
                onShare={() => setShareOpen(true)}
                onBookmark={() => void onReact('bookmark')}
                disabled={!!reacting}
              />

              <CommunityPostSharePanel postId={id} postTitle={post.title} onShared={recordShare} />
            </View>
          </View>

          <View
            style={styles.commentsCard}
            onLayout={(event) => {
              commentsOffsetRef.current = event.nativeEvent.layout.y;
            }}
          >
            <Text style={styles.commentsTitle}>Comments</Text>
            {comments.length === 0 ? <Text style={styles.commentsEmpty}>No comments yet.</Text> : null}
            <View style={styles.commentsList}>
              {comments.map((comment) => (
                <CommunityCommentRow key={comment.id} comment={comment} />
              ))}
            </View>

            <TextInput
              placeholder="Write a comment..."
              placeholderTextColor={colors.text.muted}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={2000}
              style={styles.composeInput}
            />
            {!!commentError && <Text style={styles.errorText}>{commentError}</Text>}
            <Pressable
              onPress={() => void onSubmitComment()}
              disabled={submitting || !commentText.trim()}
              style={({ pressed }) => [
                styles.submitBtn,
                (submitting || !commentText.trim()) && styles.submitBtnDisabled,
                pressed && !submitting && commentText.trim() ? styles.submitBtnPressed : null,
              ]}
            >
              <Text style={styles.submitBtnText}>Add comment</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <CommunityShareSheet
        visible={shareOpen}
        postId={id}
        postTitle={post.title}
        onClose={() => setShareOpen(false)}
        onShared={recordShare}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F8FAFC',
  },
  flex: { flex: 1 },
  centered: {
    padding: spacing.xl,
    justifyContent: 'center',
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  article: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
    ...shadows.soft,
  },
  headerBand: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FBFF',
    padding: spacing.lg,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: 'rgba(219, 234, 254, 0.7)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginBottom: spacing.sm,
  },
  categoryPillText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[700],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: '#0F172A',
    lineHeight: 32,
  },
  timestamp: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xs,
    color: '#64748B',
  },
  articleBody: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  heroImage: {
    width: '100%',
    borderRadius: radii.xl,
    backgroundColor: '#E5E7EB',
  },
  videoLink: {
    alignSelf: 'flex-start',
  },
  videoLinkText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[700],
  },
  videoFrame: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  videoWebView: {
    flex: 1,
    backgroundColor: '#000',
  },
  descriptionWebView: {
    marginTop: spacing.lg,
    width: '100%',
    backgroundColor: 'transparent',
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  commentsCard: {
    marginTop: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: colors.surfaceElevated,
    padding: spacing.lg,
    ...shadows.soft,
  },
  commentsTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: '#111827',
  },
  commentsEmpty: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: '#64748B',
  },
  commentsList: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  composeInput: {
    marginTop: spacing.md,
    minHeight: 112,
    padding: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    color: colors.text.primary,
    textAlignVertical: 'top',
    fontSize: typography.fontSize.sm,
  },
  submitBtn: {
    marginTop: spacing.sm,
    alignSelf: 'flex-end',
    borderRadius: radii.full,
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  submitBtnDisabled: {
    backgroundColor: colors.primary[300],
  },
  submitBtnPressed: {
    opacity: 0.92,
  },
  submitBtnText: {
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.sm,
  },
  errorText: {
    marginTop: spacing.sm,
    color: '#B91C1C',
    fontSize: typography.fontSize.sm,
  },
});
