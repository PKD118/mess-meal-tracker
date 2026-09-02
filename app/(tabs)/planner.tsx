import React, { useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { useOwnMealDays } from '@/hooks/useOwnMealDays';
import { useMessCancellationsRange } from '@/hooks/useMessCancellationsRange';
import { DayMealEditor } from '@/components/DayMealEditor';
import { writeOwnMealDay } from '@/firebase/mealWrites';
import { todayDhakaISO, addDaysISO, isSlotEditable } from '@/utils/cutoff';
import { formatDayLabel } from '@/utils/formatDate';
import type { SlotFields } from '@/hooks/useMealSlotEditor';

const DEFAULT_FIELDS: SlotFields = { noon: false, night: false, noonGuests: 0, nightGuests: 0 };
const PLANNER_DAYS = 9; // tomorrow through +9 days -> 10 editable days total with Dashboard's "today"

export default function PlannerScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { locale } = useLocale();
  const today = todayDhakaISO();
  const startDate = addDaysISO(today, 1);
  const endDate = addDaysISO(today, PLANNER_DAYS);

  const dates = useMemo(() => {
    const list: string[] = [];
    for (let d = startDate; d <= endDate; d = addDaysISO(d, 1)) {
      list.push(d);
    }
    return list;
  }, [startDate, endDate]);

  const { byDate: mealByDate, loading: mealLoading, error: mealError } = useOwnMealDays(user?.uid, startDate, endDate);
  const { byDate: cancelByDate, loading: cancelLoading, error: cancelError } = useMessCancellationsRange(startDate, endDate);

  const loading = mealLoading || cancelLoading;
  const error = mealError ?? cancelError;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{t('common.errorGeneric')}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('planner.title')}</Text>
      {dates.map((date) => {
        const current = mealByDate[date] ?? DEFAULT_FIELDS;
        const cancellation = cancelByDate[date];
        const noonCancelled = cancellation?.noon ?? false;
        const nightCancelled = cancellation?.night ?? false;

        return (
          <View key={date} style={styles.dayCard}>
            <Text style={styles.dayLabel}>{formatDayLabel(date, locale)}</Text>
            {(noonCancelled || nightCancelled) && (
              <Text style={styles.cancelledBadge}>{t('planner.cancelledByMess')}</Text>
            )}
            <DayMealEditor
              current={current}
              editableNoon={isSlotEditable(date, 'noon') && !noonCancelled}
              editableNight={isSlotEditable(date, 'night') && !nightCancelled}
              confirmMessage={t('dialogs.confirmSaveDate', { date: formatDayLabel(date, locale) })}
              onSave={(fields) => {
                if (user) return writeOwnMealDay({ uid: user.uid, date, ...fields });
              }}
            />
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#C0392B', fontSize: 15 },
  content: { padding: 16, gap: 16 },
  title: { fontSize: 18, fontWeight: '700', color: '#1F2933' },
  dayCard: {
    borderWidth: 1,
    borderColor: '#E4E7EB',
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  dayLabel: { fontSize: 14, fontWeight: '700', color: '#1F2933' },
  cancelledBadge: { fontSize: 12, color: '#8D5B00', backgroundColor: '#FFFBEA', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
});
