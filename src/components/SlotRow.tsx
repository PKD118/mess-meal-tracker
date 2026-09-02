import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Slot } from '@/types/models';

interface SlotRowProps {
  slot: Slot;
  off: boolean;
  guests: number;
  total: number; // (off ? 0 : 1) + guests
  editable: boolean;
  onToggleOff: (off: boolean) => void;
  onGuestsChange: (n: number) => void;
}

export function SlotRow({ slot, off, guests, total, editable, onToggleOff, onGuestsChange }: SlotRowProps) {
  const { t } = useTranslation();
  const label = t(`common.${slot}`);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <Pressable
        onPress={() => editable && onToggleOff(!off)}
        disabled={!editable}
        style={[styles.pill, off ? styles.pillOff : styles.pillOn, !editable && styles.pillDisabled]}
        accessibilityRole="button"
        accessibilityState={{ disabled: !editable }}
        accessibilityLabel={`${label} ${off ? t('common.off') : t('common.on')}`}
      >
        <Text style={styles.pillText}>{off ? t('common.off') : t('common.on')}</Text>
      </Pressable>

      {!editable ? (
        <Text style={styles.lockedText}>{t('dashboard.cutoffPassed')}</Text>
      ) : (
        <View style={styles.stepper}>
          <Pressable
            onPress={() => onGuestsChange(guests - 1)}
            disabled={guests <= 0}
            style={styles.stepperButton}
            accessibilityRole="button"
            accessibilityState={{ disabled: guests <= 0 }}
            accessibilityLabel={`${t('common.guests')} -1`}
          >
            <Text style={styles.stepperButtonText}>–</Text>
          </Pressable>
          <Text style={styles.stepperValue}>{guests}</Text>
          <Pressable
            onPress={() => onGuestsChange(guests + 1)}
            disabled={guests >= 5}
            style={styles.stepperButton}
            accessibilityRole="button"
            accessibilityState={{ disabled: guests >= 5 }}
            accessibilityLabel={`${t('common.guests')} +1`}
          >
            <Text style={styles.stepperButtonText}>+</Text>
          </Pressable>
        </View>
      )}

      <Text style={styles.total}>{t('dashboard.yourTotal')}: {total}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#1F2933' },
  pill: {
    minWidth: 64,
    minHeight: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  pillOn: { backgroundColor: '#DCF5E3' },
  pillOff: { backgroundColor: '#FBE4E4' },
  pillDisabled: { opacity: 0.5 },
  pillText: { fontSize: 14, fontWeight: '700', color: '#1F2933' },
  lockedText: { fontSize: 12, color: '#52606D' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepperButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2F6',
    borderRadius: 8,
  },
  stepperButtonText: { fontSize: 18, fontWeight: '700', color: '#1F2933' },
  stepperValue: { fontSize: 16, fontWeight: '600', minWidth: 24, textAlign: 'center', color: '#1F2933' },
  total: { fontSize: 13, color: '#52606D' },
});
