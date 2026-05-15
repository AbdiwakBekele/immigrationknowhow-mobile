import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { shadows } from '../../theme/shadows';
import { buildCommunityShareTargets } from '../../utils/communityShare';

type Props = {
  visible: boolean;
  postId: number;
  postTitle: string;
  onClose: () => void;
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
    try {
      await Share.share({ message: url });
      return true;
    } catch {
      return false;
    }
  }
}

export function CommunityShareSheet({ visible, postId, postTitle, onClose, onShared }: Props) {
  const [linkCopied, setLinkCopied] = useState(false);
  const targets = useMemo(() => buildCommunityShareTargets(postId, postTitle), [postId, postTitle]);

  useEffect(() => {
    if (!visible) {
      setLinkCopied(false);
    }
  }, [visible, postId]);

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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close share options">
        <Pressable style={styles.sheet} onPress={() => undefined}>
          <View style={styles.header}>
            <Text style={styles.title}>Share post</Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close">
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>

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
              <Ionicons name="logo-whatsapp" size={20} color="#16a34a" />
            </Pressable>
            <Pressable style={styles.action} onPress={() => void openExternal(targets.email)} accessibilityLabel="Share via email">
              <Ionicons name="mail-outline" size={20} color={colors.text.secondary} />
            </Pressable>
            <Pressable style={styles.action} onPress={() => void onCopyLink()} accessibilityLabel={linkCopied ? 'Link copied' : 'Copy link'}>
              <Ionicons
                name={linkCopied ? 'checkmark-circle' : 'copy-outline'}
                size={20}
                color={linkCopied ? colors.success : colors.text.secondary}
              />
            </Pressable>
          </View>

          <Pressable style={styles.moreBtn} onPress={() => void onMoreOptions()}>
            <Text style={styles.moreBtnText}>More options</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    borderRadius: radii.xl,
    backgroundColor: colors.surfaceElevated,
    padding: spacing.lg,
    ...shadows.soft,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  closeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
  },
  grid: {
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
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  facebookGlyph: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: '#1d4ed8',
  },
  xGlyph: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: '#0f172a',
  },
  linkedinGlyph: {
    fontSize: typography.fontSize.md,
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
