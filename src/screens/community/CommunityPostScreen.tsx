import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { AppScreen } from '../../components/AppScreen';
import { AppImage } from '../../components/AppImage';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { shadows } from '../../theme/shadows';
import * as communityApi from '../../api/communityApi';
import type { CommunityCommentPayload, CommunityPostPayload } from '../../api/communityApi';
import type { CommunityStackParamList } from './CommunityStack';
import { resolveMediaUrl } from '../../utils/resolveMediaUrl';
import { buildCommunityDescriptionDocument } from '../../utils/communityContent';
import { WebView } from 'react-native-webview';

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
  const { id } = route.params;
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
    if (type === 'share' && data?.active) {
      try {
        const link = post.video_url?.trim() || '';
        const message = link ? `${post.title}\n${link}` : post.title;
        await Share.share({ title: post.title, message, ...(Platform.OS === 'ios' && link ? { url: link } : {}) });
      } catch {
        /* user dismissed */
      }
    }
  };

  const onSubmitComment = async () => {
    const content = commentText.trim();
    if (!content || submitting) return;
    setSubmitting(true);
    const res = await communityApi.addCommunityComment(id, content);
    setSubmitting(false);
    if (!res.success) {
      Alert.alert('Comment failed', res.message);
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

  const reactions = post?.user_reactions ?? [];
  const liked = reactions.includes('like');
  const bookmarked = reactions.includes('bookmark');
  const shared = reactions.includes('share');

  return (
    <AppScreen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{post?.title ?? `Post ${id}`}</Text>
          {!!post?.tag && <Text style={styles.tag}>{post.tag}</Text>}

          {!!post?.image_url && (
            <AppImage uri={resolveMediaUrl(post.image_url)} height={220} style={styles.heroImage} contentFit="cover" />
          )}

          {!!post?.video_url && (
            <Pressable
              onPress={() => void Linking.openURL(post.video_url!)}
              style={styles.videoLink}
              accessibilityRole="link"
            >
              <Ionicons name="play-circle-outline" size={22} color={colors.primary[600]} />
              <Text style={styles.videoLinkText}>Open video</Text>
              <Ionicons name="open-outline" size={18} color={colors.primary[500]} style={{ marginLeft: spacing.sm }} />
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

          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => void onReact('like')}
              disabled={!!reacting}
              style={({ pressed }) => [styles.actionChip, liked && styles.actionChipActive, pressed && styles.actionPressed]}
            >
              <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color={liked ? colors.danger : colors.text.secondary} />
              <Text style={[styles.actionLabel, liked && styles.actionLabelActive]}>{post?.likes_count ?? 0}</Text>
            </Pressable>
            <Pressable
              onPress={() => void onReact('share')}
              disabled={!!reacting || shared}
              style={({ pressed }) => [styles.actionChip, shared && styles.actionChipMuted, pressed && styles.actionPressed]}
            >
              <Ionicons name="share-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.actionLabel}>{post?.shares_count ?? 0}</Text>
            </Pressable>
            <Pressable
              onPress={() => void onReact('bookmark')}
              disabled={!!reacting}
              style={({ pressed }) => [styles.actionChip, bookmarked && styles.actionChipActive, pressed && styles.actionPressed]}
            >
              <Ionicons name={bookmarked ? 'bookmark' : 'bookmark-outline'} size={20} color={bookmarked ? colors.primary[600] : colors.text.secondary} />
              <Text style={[styles.actionLabel, bookmarked && styles.actionLabelActive]}>{post?.bookmarks_count ?? 0}</Text>
            </Pressable>
          </View>

          <View style={styles.sectionHeader}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.text.secondary} />
            <Text style={styles.sectionTitle}>Comments ({post?.comments_count ?? comments.length})</Text>
          </View>

          {comments.map((c) => (
            <View key={c.id} style={styles.commentCard}>
              <View style={styles.commentTop}>
                {c.author_avatar_url ? (
                  <Image
                    source={{ uri: c.author_avatar_url }}
                    style={styles.avatar}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    transition={150}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={18} color={colors.text.muted} />
                  </View>
                )}
                <Text style={styles.commentAuthor}>{c.author_name}</Text>
              </View>
              <Text style={styles.commentBody}>{c.content}</Text>
            </View>
          ))}

          <Text style={styles.composeLabel}>Add a comment</Text>
          <TextInput
            placeholder="Write something respectful…"
            placeholderTextColor={colors.text.muted}
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={2000}
            style={styles.composeInput}
          />
          <Pressable
            onPress={() => void onSubmitComment()}
            disabled={submitting || !commentText.trim()}
            style={({ pressed }) => [
              styles.submitBtn,
              (submitting || !commentText.trim()) && styles.submitBtnDisabled,
              pressed && !submitting && commentText.trim() && styles.submitBtnPressed,
            ]}
          >
            <Ionicons name="send" size={18} color={colors.text.inverse} style={{ marginRight: spacing.sm }} />
            <Text style={styles.submitBtnText}>Post comment</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: {
    padding: spacing.xl,
    justifyContent: 'center',
  },
  scroll: {
    padding: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  tag: {
    marginTop: spacing.xs,
    color: colors.text.muted,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  heroImage: {
    marginTop: spacing.lg,
    borderRadius: radii.lg,
    ...shadows.soft,
  },
  videoLink: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  videoLinkText: {
    marginLeft: spacing.sm,
    color: colors.primary[700],
    fontWeight: typography.fontWeight.semibold,
    flex: 1,
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
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    ...shadows.soft,
  },
  actionChipActive: {
    borderColor: colors.primary[200],
    backgroundColor: colors.primary[50],
  },
  actionChipMuted: {
    opacity: 0.65,
  },
  actionPressed: {
    opacity: 0.88,
  },
  actionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    minWidth: 18,
  },
  actionLabelActive: {
    color: colors.primary[800],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing['2xl'],
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    fontSize: typography.fontSize.md,
  },
  commentCard: {
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    ...shadows.soft,
  },
  commentTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: spacing.md,
    backgroundColor: colors.surface,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: spacing.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  commentAuthor: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    flex: 1,
  },
  commentBody: {
    color: colors.text.primary,
    lineHeight: 22,
    fontSize: typography.fontSize.md,
  },
  composeLabel: {
    marginTop: spacing.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    fontSize: typography.fontSize.md,
  },
  composeInput: {
    marginTop: spacing.sm,
    minHeight: 100,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    color: colors.text.primary,
    textAlignVertical: 'top',
    fontSize: typography.fontSize.md,
    ...shadows.soft,
  },
  submitBtn: {
    marginTop: spacing.md,
    marginBottom: spacing['2xl'],
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    backgroundColor: colors.primary[600],
    ...shadows.soft,
  },
  submitBtnDisabled: {
    backgroundColor: colors.primary[300],
    opacity: 0.9,
  },
  submitBtnPressed: {
    opacity: 0.92,
  },
  submitBtnText: {
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.md,
  },
});
