import React from 'react';
import { View, Text, Pressable, Switch, Platform, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '@/theme';
import type { Slot } from '@/types/models';

interface SlotRowProps {
  slot: Slot;
  off: boolean;
  guests: number;
  total: number; // (off ? 0 : 1) + guests
  editable: boolean;
  cancelled?: boolean; // mess-wide manager cancellation — takes over the whole row
  onToggleOff: (off: boolean) => void;
  onGuestsChange: (n: number) => void;
}

export function SlotRow({ slot, off, guests, total, editable, cancelled = false, onToggleOff, onGuestsChange }: SlotRowProps) {
  const { t } = useTranslation();
  const label = t(`common.${slot}`);
  const on = !off;

  if (cancelled) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.label}>{label}</Text>
        </View>
        <View style={styles.cancelledBox} accessible accessibilityLabel={`${label} ${t('dashboard.mealCancelled')}`}>
          <Ionicons name="ban-outline" size={14} color={colors.warning} />
          <Text style={styles.cancelledText}>{t('dashboard.mealCancelled')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        <Switch
          value={on}
          onValueChange={(next) => { if (editable) onToggleOff(!next); }}
          disabled={!editable}
          trackColor={{ false: colors.dangerSoft, true: colors.successSoft }}
          thumbColor={Platform.OS === 'android' ? (on ? colors.success : colors.danger) : undefined}
          ios_backgroundColor={colors.dangerSoft}
          accessibilityLabel={`${label} ${on ? t('common.on') : t('common.off')}`}
        />
      </View>

      {!editable ? (
        <Text style={styles.lockedText}>{t('dashboard.cutoffPassed')}</Text>
      ) : (
        <View style={styles.stepperRow}>
          <Text style={styles.stepperLabel}>{t('common.guests')}</Text>
          <View style={styles.stepper}>
            <Pressable
              onPress={() => onGuestsChange(guests - 1)}
              disabled={guests <= 0}
              style={styles.stepperButton}
              accessibilityRole="button"
              accessibilityState={{ disabled: guests <= 0 }}
              accessibilityLabel={`${t('common.guests')} -1`}
              hitSlop={8}
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
              hitSlop={8}
            >
              <Text style={styles.stepperButtonText}>+</Text>
            </Pressable>
          </View>
        </View>
      )}

      <Text style={styles.total}>{t('dashboard.yourTotal')}: {total}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 14, color: colors.textPrimary, fontFamily: fonts.heading },
  lockedText: { fontSize: 12, color: colors.textSecondary, fontFamily: fonts.body },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepperLabel: { fontSize: 11, color: colors.textSecondary, fontFamily: fonts.bodyMedium, textTransform: 'uppercase', letterSpacing: 0.4 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepperButton: {
    minWidth: 30,
    minHeight: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
  },
  stepperButtonText: { fontSize: 16, color: colors.textPrimary, fontFamily: fonts.bodySemiBold },
  stepperValue: { fontSize: 14, minWidth: 20, textAlign: 'center', color: colors.textPrimary, fontFamily: fonts.bodySemiBold },
  total: { fontSize: 12, color: colors.textSecondary, fontFamily: fonts.body },
  cancelledBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.warningSoft,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  cancelledText: { fontSize: 12, color: colors.warning, fontFamily: fonts.bodyMedium, flexShrink: 1 },
});
