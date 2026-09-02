import type { SlotFields } from '@/hooks/useMealSlotEditor';
import type { Slot } from '@/types/models';

export interface GuestCancelCheck {
  slot: Slot;
  guestCount: number;
}

// A slot needs the "cancel your guests too?" question exactly when the
// staged edit newly turns that slot off (it was on in `current`) AND that
// slot still carries a nonzero guest count. Turning a slot back ON, or a
// slot that was already off, never triggers this.
export function guestCancelChecksNeeded(staged: SlotFields, current: SlotFields): GuestCancelCheck[] {
  const checks: GuestCancelCheck[] = [];

  const noonTurningOff = staged.noon && !current.noon;
  if (noonTurningOff && staged.noonGuests > 0) {
    checks.push({ slot: 'noon', guestCount: staged.noonGuests });
  }

  const nightTurningOff = staged.night && !current.night;
  if (nightTurningOff && staged.nightGuests > 0) {
    checks.push({ slot: 'night', guestCount: staged.nightGuests });
  }

  return checks;
}
