import { format } from 'date-fns';
import { bn, enUS } from 'date-fns/locale';
import type { Locale } from '@/types/models';
import { parseISODateLocal } from '@/utils/cutoff';

export function formatDayLabel(dateISO: string, locale: Locale): string {
  return format(parseISODateLocal(dateISO), 'EEE, MMM d', { locale: locale === 'bn' ? bn : enUS });
}

export function formatWeekday(dateISO: string, locale: Locale): string {
  return format(parseISODateLocal(dateISO), 'EEE', { locale: locale === 'bn' ? bn : enUS });
}

export function formatMonthDay(dateISO: string, locale: Locale): string {
  return format(parseISODateLocal(dateISO), 'MMM d', { locale: locale === 'bn' ? bn : enUS });
}
