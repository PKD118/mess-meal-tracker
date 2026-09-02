import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts } from '@/theme';
import { SlotRow } from '@/components/SlotRow';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useMealSlotEditor, type SlotFields } from '@/hooks/useMealSlotEditor';

interface DayMealEditorProps {
  current: SlotFields;
  editableNoon: boolean;
  editableNight: boolean;
  noonCancelled?: boolean;
  nightCancelled?: boolean;
  confirmMessage: string;
  onSave: (fields: SlotFields) => Promise<void> | void;
}

export function DayMealEditor({
  current,
  editableNoon,
  editableNight,
  noonCancelled = false,
  nightCancelled = false,
  confirmMessage,
  onSave,
}: DayMealEditorProps) {
  const { t } = useTranslation();
  const editor = useMealSlotEditor({ current, editableNoon, editableNight, confirmMessage, onSave });

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <SlotRow
          slot="noon"
          off={editor.staged.noon}
          guests={editor.staged.noonGuests}
          total={(editor.staged.noon ? 0 : 1) + editor.staged.noonGuests}
          editable={editableNoon}
          cancelled={noonCancelled}
          onToggleOff={editor.setNoonOff}
          onGuestsChange={editor.setNoonGuests}
        />
        <SlotRow
          slot="night"
          off={editor.staged.night}
          guests={editor.staged.nightGuests}
          total={(editor.staged.night ? 0 : 1) + editor.staged.nightGuests}
          editable={editableNight}
          cancelled={nightCancelled}
          onToggleOff={editor.setNightOff}
          onGuestsChange={editor.setNightGuests}
        />
      </View>

      {editor.hasChanges && (
        <Pressable onPress={editor.requestSave} style={styles.saveButton} accessibilityRole="button">
          <Text style={styles.saveButtonText}>{t('common.save')}</Text>
        </Pressable>
      )}

      {editor.activeDialog && (
        <ConfirmDialog
          message={editor.activeDialog.message}
          confirmLabel={editor.activeDialog.confirmLabel}
          cancelLabel={editor.activeDialog.cancelLabel}
          onConfirm={editor.activeDialog.onConfirm}
          onCancel={editor.activeDialog.onCancel}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  row: { flexDirection: 'row', gap: 16 },
  saveButton: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: { color: colors.textOnPrimary, fontSize: 15, fontFamily: fonts.bodySemiBold },
});
