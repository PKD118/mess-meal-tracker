import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ConfirmDialogProps } from '@/components/ConfirmDialog';
import { guestCancelChecksNeeded } from '@/utils/guestCancelCheck';

export interface SlotFields {
  noon: boolean; // true = self OFF
  night: boolean; // true = self OFF
  noonGuests: number;
  nightGuests: number;
}

interface UseMealSlotEditorOptions {
  current: SlotFields;
  editableNoon: boolean;
  editableNight: boolean;
  confirmMessage: string; // pre-translated, e.g. "Save changes for today?"
  onSave: (fields: SlotFields) => Promise<void> | void;
}

// Staged edit + confirm-dialog sequencing for one day's noon/night state.
// Nothing writes until the final "Save changes?" confirm; turning a slot off
// while it still carries guests asks a dedicated guest-cancel question first.
export function useMealSlotEditor({
  current,
  editableNoon,
  editableNight,
  confirmMessage,
  onSave,
}: UseMealSlotEditorOptions) {
  const { t } = useTranslation();
  const [staged, setStaged] = useState<SlotFields>(current);
  const [dialogQueue, setDialogQueue] = useState<ConfirmDialogProps[]>([]);
  // `current` arrives async (loading default -> real Firestore value). Only
  // re-sync `staged` from it while the user hasn't made an unsaved edit yet,
  // so a late-arriving snapshot never clobbers in-progress local changes.
  const userEditedRef = useRef(false);

  useEffect(() => {
    if (!userEditedRef.current) {
      setStaged(current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.noon, current.night, current.noonGuests, current.nightGuests]);

  const hasChanges =
    staged.noon !== current.noon ||
    staged.night !== current.night ||
    staged.noonGuests !== current.noonGuests ||
    staged.nightGuests !== current.nightGuests;

  const setNoonOff = useCallback((off: boolean) => {
    if (!editableNoon) return;
    userEditedRef.current = true;
    setStaged((s) => ({ ...s, noon: off }));
  }, [editableNoon]);

  const setNightOff = useCallback((off: boolean) => {
    if (!editableNight) return;
    userEditedRef.current = true;
    setStaged((s) => ({ ...s, night: off }));
  }, [editableNight]);

  const setNoonGuests = useCallback((n: number) => {
    if (!editableNoon) return;
    userEditedRef.current = true;
    setStaged((s) => ({ ...s, noonGuests: Math.max(0, Math.min(5, n)) }));
  }, [editableNoon]);

  const setNightGuests = useCallback((n: number) => {
    if (!editableNight) return;
    userEditedRef.current = true;
    setStaged((s) => ({ ...s, nightGuests: Math.max(0, Math.min(5, n)) }));
  }, [editableNight]);

  const discard = useCallback(() => {
    userEditedRef.current = false;
    setStaged(current);
  }, [current]);

  const requestSave = useCallback(() => {
    let finalFields: SlotFields = { ...staged };
    const steps: ConfirmDialogProps[] = [];
    const advance = () => setDialogQueue((q) => q.slice(1));

    guestCancelChecksNeeded(staged, current).forEach(({ slot, guestCount }) => {
      const guestsField = slot === 'noon' ? 'noonGuests' : 'nightGuests';
      steps.push({
        message: t('dialogs.guestCancelQuestion', { count: guestCount, slot: t(`common.${slot}`) }),
        confirmLabel: t('common.yes'),
        cancelLabel: t('common.no'),
        onConfirm: () => {
          finalFields = { ...finalFields, [guestsField]: 0 };
          advance();
        },
        onCancel: advance,
      });
    });

    steps.push({
      message: confirmMessage,
      confirmLabel: t('common.yes'),
      cancelLabel: t('common.no'),
      onConfirm: () => {
        setDialogQueue([]);
        userEditedRef.current = false;
        setStaged(finalFields);
        onSave(finalFields);
      },
      onCancel: () => {
        setDialogQueue([]);
        discard();
      },
    });

    setDialogQueue(steps);
  }, [staged, current, confirmMessage, onSave, t, discard]);

  return {
    staged,
    hasChanges,
    setNoonOff,
    setNightOff,
    setNoonGuests,
    setNightGuests,
    discard,
    requestSave,
    activeDialog: dialogQueue[0] ?? null,
  };
}
