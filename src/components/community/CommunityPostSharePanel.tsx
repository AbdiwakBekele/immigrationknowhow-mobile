import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { buildCommunityShareTargets } from '../../utils/communityShare';

type Props = {
  postId: number;
  postTitle: string;
  onShared?: () => void | Promise<void>;
};

async function copyShareUrl(url: string): Promise<boolean> {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      return false;
    }
  }

  try {
    await Clipboard.setStringAsync(url);
    return true;
  } catch {
    return false;
  }
}

export function CommunityPostSharePanel({ postId, postTitle, onShared }: Props) {
  const [linkCopied, setLinkCopied] = useState(false);
  const targets = useMemo(() => buildCommunityShareTargets(postId, postTitle), [postId, postTitle]);

  useEffect(() => {
    setLinkCopied(false);
  }, [postId]);

  const recordShare = async () => {
    if (onShared) {
      await onShared();
    }
  };

  const openExternal = async (url: string) => {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert('Unable to open link', 'This share option is not available on this device.');
      return;
    }
    await Linking.openURL(url);
    await recordShare();
  };

  const onCopyLink = async () => {
    const copied = await copyShareUrl(targets.shareUrl);
    if (!copied) {
      Alert.alert('Copy failed', 'Could not copy the post link.');
      return;
    }
    setLinkCopied(true);
    await recordShare();
  };

  const onMoreOptions = async () => {
    try {
      await Share.share({
        title: postTitle,
        message: `${postTitle}\n${targets.shareUrl}`,
        ...(Platform.OS === 'ios' ? { url: targets.shareUrl } : {}),
      });
      await recordShare();
    } catch {
      /* dismissed */
    }
  };

  return (
    <View style={styles.panel}>
      <Text style={styles.eyebrow}>Share this post</Text>
      <Text selectable style={styles.url}>
        {targets.shareUrl}
      </Text>
      <View style={styles.grid}>
        <Pressable style={styles.action} onPress={() => void openExternal(targets.facebook)} accessibilityLabel="Share on Facebook">
          <Text style={styles.facebookGlyph}>f</Text>
        </Pressable>
        <Pressable style={styles.action} onPress={() => void openExternal(targets.x)} accessibilityLabel="Share on X">
          <Text style={styles.xGlyph}>X</Text>
        </Pressable>
        <Pressable style={styles.action} onPress={() => void openExternal(targets.linkedin)} accessibilityLabel="Share on LinkedIn">
          <Text style={styles.linkedinGlyph}>in</Text>
        </Pressable>
        <Pressable style={styles.action} onPress={() => void openExternal(targets.whatsapp)} accessibilityLabel="Share on WhatsApp">
          <Ionicons name="logo-whatsapp" size={18} color="#16a34a" />
        </Pressable>
        <Pressable style={styles.action} onPress={() => void openExternal(targets.email)} accessibilityLabel="Share via email">
          <Ionicons name="mail-outline" size={18} color={colors.text.secondary} />
        </Pressable>
        <Pressable style={styles.action} onPress={() => void onCopyLink()} accessibilityLabel={linkCopied ? 'Link copied' : 'Copy link'}>
          <Ionicons
            name={linkCopied ? 'checkmark-circle' : 'copy-outline'}
            size={18}
            color={linkCopied ? colors.success : colors.text.secondary}
          />
        </Pressable>
      </View>
      <Pressable style={styles.moreBtn} onPress={() => void onMoreOptions()}>
        <Text style={styles.moreBtnText}>More share options</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginTop: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: 'rgba(239, 246, 255, 0.7)',
    padding: spacing.lg,
  },
  eyebrow: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#475569',
  },
  url: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xs,
    color: '#64748B',
  },
  grid: {
    marginTop: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  action: {
    width: '30%',
    minWidth: 88,
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceElevated,
  },
  facebookGlyph: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: '#1d4ed8',
  },
  xGlyph: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: '#0f172a',
  },
  linkedinGlyph: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: '#0a66c2',
  },
  moreBtn: {
    marginTop: spacing.md,
    alignSelf: 'flex-end',
    borderRadius: radii.full,
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  moreBtnText: {
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.sm,
  },
});
