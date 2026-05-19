import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { CommunityPostPayload } from '../../api/communityApi';
import { CommunityEngagementBar } from './CommunityEngagementBar';
import { CommunityPostMedia } from './CommunityPostMedia';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { shadows } from '../../theme/shadows';
import { communityDescriptionPlainText } from '../../utils/communityContent';
import { communitySectionLabel, formatCommunityDate } from '../../utils/communityDisplay';

export type CommunityFeedEngagement = {
  liked: boolean;
  bookmarked: boolean;
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
};

type Props = {
  post: CommunityPostPayload;
  engagement: CommunityFeedEngagement;
  onOpen: () => void;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onBookmark: () => void;
  reacting?: boolean;
};

export function CommunityPostFeedCard({
  post,
  engagement,
  onOpen,
  onLike,
  onComment,
  onShare,
  onBookmark,
  reacting = false,
}: Props) {
  const plainDescription = communityDescriptionPlainText(post.description, 320);
  const publishedAt = formatCommunityDate(post.created_at);
  const section = communitySectionLabel(post.category);

  return (
    <View style={styles.card}>
      <CommunityPostMedia post={post} variant="feed" onMediaPress={onOpen} />

      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`Open post: ${post.title}`}
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        <View style={styles.body}>
          <View style={styles.metaRow}>
            <Text style={styles.metaText} numberOfLines={1}>
              {section}
              {post.tag ? ` · ${post.tag}` : ''}
            </Text>
            {!!publishedAt && <Text style={styles.metaDate}>{publishedAt}</Text>}
          </View>

          <Text style={styles.title}>{post.title ?? `Post #${post.id}`}</Text>

          {!!plainDescription && (
            <Text style={styles.description} numberOfLines={4}>
              {plainDescription}
            </Text>
          )}
        </View>
      </Pressable>

      <View style={styles.divider} />

      <View style={styles.actions}>
        <CommunityEngagementBar
          variant="social"
          liked={engagement.liked}
          bookmarked={engagement.bookmarked}
          likes={engagement.likes}
          comments={engagement.comments}
          shares={engagement.shares}
          bookmarks={engagement.bookmarks}
          onLike={onLike}
          onComment={onComment}
          onShare={onShare}
          onBookmark={onBookmark}
          disabled={reacting}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E2E8F0',
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
    ...shadows.soft,
  },
  pressed: {
    opacity: 0.98,
  },
  body: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  metaText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[700],
    textTransform: 'uppercase',
    letterSpacing: 0.35,
  },
  metaDate: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    lineHeight: 26,
  },
  description: {
    fontSize: typography.fontSize.md,
    lineHeight: 22,
    color: colors.text.secondary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E2E8F0',
    marginHorizontal: spacing.md,
  },
  actions: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
