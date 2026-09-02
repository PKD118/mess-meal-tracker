import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';

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
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '100%', maxWidth: 360 },
  message: { fontSize: 16, color: '#1F2933', marginBottom: 20 },
  row: { flexDirection: 'row', gap: 12 },
  button: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2F6',
  },
  buttonPrimary: { backgroundColor: '#1F6FEB' },
  buttonText: { fontSize: 15, fontWeight: '600', color: '#1F2933' },
  buttonPrimaryText: { color: '#fff' },
});
