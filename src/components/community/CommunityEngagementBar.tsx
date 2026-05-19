import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Props = {
  liked: boolean;
  bookmarked: boolean;
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
  onLike: () => void;
  onComment?: () => void;
  onShare: () => void;
  onBookmark: () => void;
  disabled?: boolean;
  compact?: boolean;
  /** Instagram / Facebook style icon row */
  variant?: 'default' | 'social';
};

function CountPill({ value }: { value: number }) {
  return (
    <View style={styles.countPill}>
      <Text style={styles.countPillText}>{value}</Text>
    </View>
  );
}

function SocialAction({
  icon,
  activeIcon,
  label,
  count,
  active,
  activeColor,
  onPress,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon?: keyof typeof Ionicons.glyphMap;
  label: string;
  count: number;
  active?: boolean;
  activeColor?: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const name = active && activeIcon ? activeIcon : icon;
  const color = active && activeColor ? activeColor : colors.text.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      style={({ pressed }) => [styles.socialAction, pressed && !disabled ? styles.socialActionPressed : null]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={name} size={24} color={color} />
      {count > 0 ? <Text style={styles.socialCount}>{count}</Text> : null}
    </Pressable>
  );
}

export function CommunityEngagementBar({
  liked,
  bookmarked,
  likes,
  comments,
  shares,
  bookmarks,
  onLike,
  onComment,
  onShare,
  onBookmark,
  disabled = false,
  compact = false,
  variant = 'default',
}: Props) {
  if (variant === 'social') {
    const totalEngagement = likes + comments + shares;
    return (
      <View>
        {totalEngagement > 0 ? (
          <Text style={styles.socialSummary}>
            {likes > 0 ? `${likes} like${likes === 1 ? '' : 's'}` : null}
            {likes > 0 && comments > 0 ? ' · ' : null}
            {comments > 0 ? `${comments} comment${comments === 1 ? '' : 's'}` : null}
          </Text>
        ) : null}
        <View style={styles.socialRow}>
          <View style={styles.socialLeft}>
            <SocialAction
              icon="heart-outline"
              activeIcon="heart"
              label="Like"
              count={likes}
              active={liked}
              activeColor="#e11d48"
              onPress={onLike}
              disabled={disabled}
            />
            <SocialAction
              icon="chatbubble-outline"
              label="Comment"
              count={comments}
              onPress={onComment}
              disabled={disabled}
            />
            <SocialAction icon="paper-plane-outline" label="Share" count={shares} onPress={onShare} disabled={disabled} />
          </View>
          <SocialAction
            icon="bookmark-outline"
            activeIcon="bookmark"
            label="Save"
            count={bookmarks}
            active={bookmarked}
            activeColor={colors.primary[700]}
            onPress={onBookmark}
            disabled={disabled}
          />
        </View>
      </View>
    );
  }

  const iconSize = compact ? 16 : 18;
  const labelStyle = compact ? styles.labelCompact : styles.label;

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onLike}
        disabled={disabled}
        style={({ pressed }) => [
          styles.pill,
          liked ? styles.pillLiked : null,
          pressed && !disabled ? styles.pillPressed : null,
          disabled ? styles.pillDisabled : null,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Like post"
      >
        <Ionicons name={liked ? 'heart' : 'heart-outline'} size={iconSize} color={liked ? '#e11d48' : colors.text.secondary} />
        <Text style={[labelStyle, liked ? styles.labelLiked : null]}>Like</Text>
        <CountPill value={likes} />
      </Pressable>

      <Pressable
        onPress={onComment}
        disabled={disabled || !onComment}
        style={({ pressed }) => [
          styles.pill,
          pressed && onComment && !disabled ? styles.pillPressed : null,
          disabled || !onComment ? styles.pillDisabled : null,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Comment on post"
      >
        <Ionicons name="chatbubble-outline" size={iconSize} color={colors.text.secondary} />
        <Text style={labelStyle}>Comment</Text>
        <CountPill value={comments} />
      </Pressable>

      <Pressable
        onPress={onShare}
        disabled={disabled}
        style={({ pressed }) => [styles.pill, pressed && !disabled ? styles.pillPressed : null, disabled ? styles.pillDisabled : null]}
        accessibilityRole="button"
        accessibilityLabel="Share post"
      >
        <Ionicons name="share-outline" size={iconSize} color={colors.text.secondary} />
        <Text style={labelStyle}>Share</Text>
        <CountPill value={shares} />
      </Pressable>

      <Pressable
        onPress={onBookmark}
        disabled={disabled}
        style={({ pressed }) => [
          styles.pill,
          bookmarked ? styles.pillBookmarked : null,
          pressed && !disabled ? styles.pillPressed : null,
          disabled ? styles.pillDisabled : null,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Save post"
      >
        <Ionicons
          name={bookmarked ? 'bookmark' : 'bookmark-outline'}
          size={iconSize}
          color={bookmarked ? colors.primary[700] : colors.text.secondary}
        />
        <Text style={[labelStyle, bookmarked ? styles.labelBookmarked : null]}>Save</Text>
        <CountPill value={bookmarks} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  socialSummary: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  socialLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  socialAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingVertical: 4,
  },
  socialActionPressed: {
    opacity: 0.65,
  },
  socialCount: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    minWidth: 16,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: colors.surfaceElevated,
  },
  pillLiked: {
    borderColor: '#FECDD3',
    backgroundColor: '#FFF1F2',
  },
  pillBookmarked: {
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
  },
  pillPressed: {
    opacity: 0.9,
  },
  pillDisabled: {
    opacity: 0.7,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
  },
  labelCompact: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
  },
  labelLiked: {
    color: '#be123c',
  },
  labelBookmarked: {
    color: colors.primary[800],
  },
  countPill: {
    borderRadius: radii.full,
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 22,
    alignItems: 'center',
  },
  countPillText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
  },
});
