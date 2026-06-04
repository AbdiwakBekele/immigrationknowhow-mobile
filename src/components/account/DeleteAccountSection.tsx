import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '../AppButton';
import { AppInput } from '../AppInput';
import * as accountApi from '../../api/accountApi';
import { friendlyApiErrorMessage } from '../../api/userFriendlyMessage';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/layout';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Props = {
  onDeleted: () => void | Promise<void>;
  hasMultipleRoles?: boolean;
};

export function DeleteAccountSection({ onDeleted, hasMultipleRoles = false }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setPassword('');
    setConfirmation('');
    setError(null);
  }, []);

  const openModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const closeModal = () => {
    if (busy) return;
    setModalOpen(false);
    resetForm();
  };

  const onConfirmDelete = async () => {
    setBusy(true);
    setError(null);
    const res = await accountApi.deleteAccount({ password, confirmation });
    setBusy(false);
    if (!res.success) {
      setError(friendlyApiErrorMessage(res));
      return;
    }
    setModalOpen(false);
    resetForm();
    await onDeleted();
  };

  const canSubmit = password.length > 0 && confirmation === 'DELETE' && !busy;

  return (
    <>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconWrap}>
            <Ionicons name="warning-outline" size={22} color="#b91c1c" />
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.title}>Delete account</Text>
            <Text style={styles.help}>
              Permanently removes your login and profile access. This cannot be undone.
            </Text>
          </View>
        </View>
        <Pressable style={styles.dangerButton} onPress={openModal} accessibilityRole="button">
          <Text style={styles.dangerButtonText}>Delete account</Text>
        </Pressable>
      </View>

      <Modal
        visible={modalOpen}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.backdrop} onPress={closeModal} disabled={busy}>
            <Pressable style={styles.sheet} onPress={() => {}}>
              <View style={styles.sheetHandle} />

              <View style={styles.sheetHeader}>
                <View style={styles.sheetTitleRow}>
                  <View style={styles.sheetIconWrap}>
                    <Ionicons name="warning" size={24} color="#b91c1c" />
                  </View>
                  <View style={styles.sheetTitleText}>
                    <Text style={styles.sheetTitle}>Delete your account?</Text>
                    <Text style={styles.sheetSubtitle}>Confirm below to permanently delete your account.</Text>
                  </View>
                </View>
                <Pressable
                  onPress={closeModal}
                  hitSlop={12}
                  disabled={busy}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <Ionicons name="close" size={24} color={colors.text.muted} />
                </Pressable>
              </View>

              <ScrollView
                style={styles.sheetScroll}
                contentContainerStyle={styles.sheetScrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.warningBox}>
                  <Text style={styles.warningTitle}>You will lose access to:</Text>
                  <Text style={styles.warningItem}>• Your profile and saved preferences</Text>
                  <Text style={styles.warningItem}>• Messages and inquiries</Text>
                  <Text style={styles.warningItem}>• Purchases and subscriptions tied to this email</Text>
                  {hasMultipleRoles ? (
                    <Text style={styles.warningItem}>• Both service seeker and provider data on this login</Text>
                  ) : null}
                </View>

                <AppInput
                  label="Current password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholder="Your password"
                  autoCapitalize="none"
                />
                <View style={{ height: spacing.md }} />
                <AppInput
                  label="Type DELETE to confirm"
                  value={confirmation}
                  onChangeText={setConfirmation}
                  placeholder="DELETE"
                  autoCapitalize="characters"
                />

                {error ? <Text style={styles.errorText}>{error}</Text> : null}
              </ScrollView>

              <View style={styles.sheetFooter}>
                <AppButton title="Cancel" onPress={closeModal} variant="ghost" disabled={busy} />
                <View style={{ height: spacing.sm }} />
                <Pressable
                  style={[styles.deleteConfirmButton, !canSubmit && styles.deleteConfirmButtonDisabled]}
                  onPress={() => void onConfirmDelete()}
                  disabled={!canSubmit}
                  accessibilityRole="button"
                >
                  {busy ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <View style={styles.deleteConfirmInner}>
                      <Ionicons name="trash-outline" size={18} color="#fff" />
                      <Text style={styles.deleteConfirmText}>Permanently delete account</Text>
                    </View>
                  )}
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.xl,
    marginBottom: spacing['2xl'],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: colors.surfaceElevated,
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderText: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  help: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    lineHeight: 20,
  },
  dangerButton: {
    marginTop: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  dangerButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: '#b91c1c',
  },
  modalRoot: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: 0,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  sheetTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginRight: spacing.sm,
  },
  sheetIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitleText: {
    flex: 1,
  },
  sheetTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  sheetSubtitle: {
    marginTop: 4,
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    lineHeight: 20,
  },
  sheetScroll: {
    flexGrow: 0,
  },
  sheetScrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  warningBox: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  warningTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: '#991b1b',
    marginBottom: spacing.sm,
  },
  warningItem: {
    fontSize: typography.fontSize.sm,
    color: '#b91c1c',
    lineHeight: 22,
    marginTop: 2,
  },
  errorText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.sm,
    color: '#b91c1c',
  },
  sheetFooter: {
    padding: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  deleteConfirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#dc2626',
    paddingVertical: spacing.md,
    minHeight: 52,
  },
  deleteConfirmButtonDisabled: {
    opacity: 0.45,
  },
  deleteConfirmInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteConfirmText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: '#fff',
  },
});
