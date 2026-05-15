import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import type { CommunityPostPayload } from '../../api/communityApi';
import { AppImage } from '../AppImage';
import { CommunityEngagementBar } from './CommunityEngagementBar';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { shadows } from '../../theme/shadows';
import { youtubeVideoIdFromUrl } from '../../utils/communityDisplay';
import { resolveMediaUrl } from '../../utils/resolveMediaUrl';

const FEED_IMAGE_HEIGHT = 160;

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
  const youtubeId = youtubeVideoIdFromUrl(post.video_url);

  return (
    <View style={styles.card}>
      <Pressable onPress={onOpen} style={({ pressed }) => [styles.contentPressable, pressed ? styles.contentPressed : null]}>
        {!!post.image_url && (
          <AppImage
            uri={resolveMediaUrl(post.image_url)}
            height={FEED_IMAGE_HEIGHT}
            style={styles.heroImage}
            contentFit="cover"
          />
        )}
        {!!post.video_url && !youtubeId && (
          <Pressable onPress={() => void Linking.openURL(post.video_url!)} style={styles.videoLink} accessibilityRole="link">
            <Text style={styles.videoLinkText}>Open video</Text>
          </Pressable>
        )}
        {!!youtubeId && (
          <View style={styles.videoFrame}>
            <WebView
              source={{ uri: `https://www.youtube.com/embed/${youtubeId}` }}
              style={styles.videoWebView}
              allowsFullscreenVideo
              javaScriptEnabled
              domStorageEnabled
              scrollEnabled={false}
            />
          </View>
        )}
        {!!post.tag && (
          <View style={styles.tagPill}>
            <Text style={styles.tagText}>{post.tag}</Text>
          </View>
        )}
        <Text style={styles.title}>{post.title ?? `Post #${post.id}`}</Text>
        {!!post.description && (
          <Text style={styles.description} numberOfLines={3}>
            {post.description}
          </Text>
        )}
      </Pressable>

      <CommunityEngagementBar
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
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: colors.surfaceElevated,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.soft,
  },
  contentPressable: {
    gap: spacing.sm,
  },
  contentPressed: {
    opacity: 0.96,
  },
  heroImage: {
    width: '100%',
    borderRadius: radii.lg,
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
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  videoWebView: {
    flex: 1,
    backgroundColor: '#000',
  },
  tagPill: {
    alignSelf: 'flex-start',
    borderRadius: radii.full,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: '#3730A3',
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: '#111827',
    lineHeight: 26,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4B5563',
  },
});
