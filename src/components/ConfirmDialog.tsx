import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, fonts } from '@/theme';

export interface ConfirmDialogProps {
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// Dumb, reusable confirm modal — no knowledge of what it's confirming. Both
// buttons get equal size/weight (44px, same style) so "no" is never harder
// to tap than "yes".
export function ConfirmDialog({ message, confirmLabel, cancelLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card} accessibilityViewIsModal accessibilityRole="alert">
          <Text style={styles.message}>{message}</Text>
          <View style={styles.row}>
            <Pressable onPress={onCancel} style={styles.button} accessibilityRole="button">
              <Text style={styles.buttonText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable onPress={onConfirm} style={[styles.button, styles.buttonPrimary]} accessibilityRole="button">
              <Text style={[styles.buttonText, styles.buttonPrimaryText]}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 22,
    width: '100%',
    maxWidth: 360,
    shadowColor: '#0F1B2E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
  message: { fontSize: 16, color: colors.textPrimary, marginBottom: 20, fontFamily: fonts.body, lineHeight: 22 },
  row: { flexDirection: 'row', gap: 12 },
  button: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  buttonPrimary: { backgroundColor: colors.primary },
  buttonText: { fontSize: 15, color: colors.textPrimary, fontFamily: fonts.bodySemiBold },
  buttonPrimaryText: { color: colors.textOnPrimary },
});
