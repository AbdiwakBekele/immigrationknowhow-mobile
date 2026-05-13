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
};

function CountPill({ value }: { value: number }) {
  return (
    <View style={styles.countPill}>
      <Text style={styles.countPillText}>{value}</Text>
    </View>
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
}: Props) {
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
