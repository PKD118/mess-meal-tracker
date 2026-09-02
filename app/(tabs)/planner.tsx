import React, { useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { colors, fonts, shadow, accentPalette } from '@/theme';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { useOwnMealDays } from '@/hooks/useOwnMealDays';
import { useMessCancellationsRange } from '@/hooks/useMessCancellationsRange';
import { DayMealEditor } from '@/components/DayMealEditor';
import { writeOwnMealDay } from '@/firebase/mealWrites';
import { todayDhakaISO, addDaysISO, isSlotEditable, parseISODateLocal } from '@/utils/cutoff';
import { formatDayLabel, formatWeekday, formatMonthDay } from '@/utils/formatDate';
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
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('planner.title')}</Text>
      {dates.map((date, i) => {
        const current = mealByDate[date] ?? DEFAULT_FIELDS;
        const cancellation = cancelByDate[date];
        const noonCancelled = cancellation?.noon ?? false;
        const nightCancelled = cancellation?.night ?? false;
        const accent = accentPalette[i % accentPalette.length];

        return (
          <View key={date} style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <LinearGradient colors={[accent.from, accent.to]} style={styles.dateBadge}>
                <Text style={styles.dateBadgeNum}>{parseISODateLocal(date).getDate()}</Text>
              </LinearGradient>
              <View>
                <Text style={styles.weekday}>{formatWeekday(date, locale)}</Text>
                <Text style={styles.monthDay}>{formatMonthDay(date, locale)}</Text>
              </View>
            </View>
            <DayMealEditor
              current={current}
              editableNoon={isSlotEditable(date, 'noon') && !noonCancelled}
              editableNight={isSlotEditable(date, 'night') && !nightCancelled}
              noonCancelled={noonCancelled}
              nightCancelled={nightCancelled}
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
  screen: { flex: 1, backgroundColor: colors.page },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.page },
  errorText: { color: colors.danger, fontSize: 15, fontFamily: fonts.bodyMedium },
  content: { padding: 16, gap: 14 },
  title: { fontSize: 20, color: colors.textPrimary, fontFamily: fonts.headingBold, marginBottom: 2 },
  dayCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    gap: 10,
    ...shadow.card,
  },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dateBadge: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dateBadgeNum: { fontSize: 16, color: colors.textOnPrimary, fontFamily: fonts.headingBold },
  weekday: { fontSize: 14, color: colors.textPrimary, fontFamily: fonts.heading },
  monthDay: { fontSize: 12, color: colors.textSecondary, fontFamily: fonts.body },
});
