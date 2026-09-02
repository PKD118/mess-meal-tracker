import { guestCancelChecksNeeded } from '@/utils/guestCancelCheck';
import type { SlotFields } from '@/hooks/useMealSlotEditor';

function fields(overrides: Partial<SlotFields> = {}): SlotFields {
  return { noon: false, night: false, noonGuests: 0, nightGuests: 0, ...overrides };
}

describe('guestCancelChecksNeeded', () => {
  test('no question when nothing changes', () => {
    expect(guestCancelChecksNeeded(fields(), fields())).toEqual([]);
  });

  test('no question when turning noon off with zero guests', () => {
    const current = fields();
    const staged = fields({ noon: true });
    expect(guestCancelChecksNeeded(staged, current)).toEqual([]);
  });

  test('asks when turning noon off while guests are booked', () => {
    const current = fields();
    const staged = fields({ noon: true, noonGuests: 3 });
    expect(guestCancelChecksNeeded(staged, current)).toEqual([{ slot: 'noon', guestCount: 3 }]);
  });

  test('asks for both slots independently when both are turned off with guests', () => {
    const current = fields();
    const staged = fields({ noon: true, noonGuests: 2, night: true, nightGuests: 1 });
    expect(guestCancelChecksNeeded(staged, current)).toEqual([
      { slot: 'noon', guestCount: 2 },
      { slot: 'night', guestCount: 1 },
    ]);
  });

  test('does not ask when a slot was already off (no new transition)', () => {
    const current = fields({ noon: true, noonGuests: 4 });
    const staged = fields({ noon: true, noonGuests: 4 });
    expect(guestCancelChecksNeeded(staged, current)).toEqual([]);
  });

  test('does not ask when turning a slot back on', () => {
    const current = fields({ noon: true, noonGuests: 2 });
    const staged = fields({ noon: false, noonGuests: 2 });
    expect(guestCancelChecksNeeded(staged, current)).toEqual([]);
  });

  test('adding guests to a slot that stays on never asks', () => {
    const current = fields();
    const staged = fields({ noonGuests: 5 });
    expect(guestCancelChecksNeeded(staged, current)).toEqual([]);
  });
});
