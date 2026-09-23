import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { shadows } from '../../theme/shadows';
import * as ebookShareApi from '../../api/ebookShareApi';
import { BASE_URL } from '../../config/api';
import { buildEbookShareTargets } from '../../utils/ebookShare';

type Props = {
  visible: boolean;
  slug: string;
  title: string;
  onClose: () => void;
  onUpdated?: (campaign: any) => void;
};

export function EbookShareSheet({ visible, slug, title, onClose, onUpdated }: Props) {
  const [busy, setBusy] = useState(false);
  const shareTitle = useMemo(() => `"${title}" on IKH Library`, [title]);

  useEffect(() => {
    if (!visible) {
      setBusy(false);
    }
  }, [visible, slug]);

  const shareVia = async (platform: 'facebook' | 'x') => {
    if (busy) return;
    setBusy(true);

    try {
      const res = await ebookShareApi.recordEbookShareIntent(slug, platform);
      if (!res.success) {
        Alert.alert('Share', res.message);
        return;
      }

      if (res.data?.campaign && onUpdated) {
        onUpdated(res.data.campaign);
      }

      const eventShareUrl = res.data?.share_url || res.data?.event?.share_url;
      if (!eventShareUrl) {
        Alert.alert('Share', 'Share link is not ready yet. Please try again.');
        return;
      }

      const targets = buildEbookShareTargets(eventShareUrl, title, BASE_URL);
      const url = platform === 'facebook' ? targets.facebook : targets.x;
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        Alert.alert('Share', 'This share option is not available on this device.');
        return;
      }

      await Linking.openURL(url);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>Share for a free ebook</Text>
          <Text style={styles.subtitle}>
            Share this ebook on social media. Complete 5 different ebook shares to earn one free book coupon.
          </Text>

          <Pressable style={styles.option} disabled={busy} onPress={() => void shareVia('facebook')}>
            {busy ? (
              <ActivityIndicator size="small" color={colors.primary[700]} />
            ) : (
              <Ionicons name="logo-facebook" size={20} color="#1d4ed8" />
            )}
            <Text style={styles.optionText}>Share on Facebook</Text>
          </Pressable>

          <Pressable style={styles.option} disabled={busy} onPress={() => void shareVia('x')}>
            {busy ? (
              <ActivityIndicator size="small" color={colors.primary[700]} />
            ) : (
              <Ionicons name="logo-twitter" size={20} color="#0f172a" />
            )}
            <Text style={styles.optionText}>Share on X</Text>
          </Pressable>

          <Pressable style={styles.cancel} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    ...shadows.lg,
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
  },
  subtitle: {
    marginTop: spacing.xs,
    ...typography.bodySm,
    color: colors.text.muted,
  },
  option: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  optionText: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  cancel: {
    marginTop: spacing.lg,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  cancelText: {
    ...typography.body,
    color: colors.text.muted,
    fontWeight: '600',
  },
});
