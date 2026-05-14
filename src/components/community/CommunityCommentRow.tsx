import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import type { CommunityCommentPayload } from '../../api/communityApi';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { commentInitials } from '../../utils/communityDisplay';

type Props = {
  comment: CommunityCommentPayload;
};

export function CommunityCommentRow({ comment }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {comment.author_avatar_url ? (
          <Image source={{ uri: comment.author_avatar_url }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitials}>{commentInitials(comment.author_name)}</Text>
          </View>
        )}
        <View style={styles.bodyCol}>
          <Text style={styles.author}>{comment.author_name}</Text>
          <Text style={styles.content}>{comment.content}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2E8F0',
  },
  avatarInitials: {
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
    color: '#334155',
  },
  bodyCol: {
    flex: 1,
    minWidth: 0,
  },
  author: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: '#334155',
  },
  content: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: '#475569',
  },
});
