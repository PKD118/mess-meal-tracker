export type Locale = 'en' | 'bn';
export type Slot = 'noon' | 'night';

export interface UserProfile {
  uid: string;
  name: string;
  phone: string;
  isManager: boolean;
  locale: Locale;
  createdAt: number;
}

export interface MealDayDoc {
  uid: string;
  date: string; // YYYY-MM-DD, Dhaka calendar date
  noon: boolean; // true = self OFF
  night: boolean; // true = self OFF
  noonGuests: number; // 0-5
  nightGuests: number; // 0-5
  updatedAt: number;
}

export interface MessCancellationDoc {
  date: string;
  noon: boolean;
  night: boolean;
  setBy: string;
  updatedAt: number;
}

export interface ResolvedSlotStatus {
  selfOn: boolean;
  guests: number;
  total: number; // selfOn ? 1 : 0, + guests, zeroed if mess-cancelled
  messCancelled: boolean;
  editable: boolean; // cutoff not yet passed (mess cancellation bypasses this for managers only)
}
