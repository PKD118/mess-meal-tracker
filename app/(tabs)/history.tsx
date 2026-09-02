import React, { useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { useOwnMealDays } from '@/hooks/useOwnMealDays';
import { useMessCancellationsRange } from '@/hooks/useMessCancellationsRange';
import { buildHistoryRows, type OffBy } from '@/utils/buildHistoryRows';
import { todayDhakaISO, addDaysISO, firstOfPrevMonthISO } from '@/utils/cutoff';
import { formatDayLabel } from '@/utils/formatDate';

export default function HistoryScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { locale } = useLocale();
  const today = todayDhakaISO();
  const startDate = firstOfPrevMonthISO(today);
  const endDate = addDaysISO(today, -1); // strictly past — today lives on the Dashboard

  const { byDate: mealByDate, loading: mealLoading, error: mealError } = useOwnMealDays(user?.uid, startDate, endDate);
  const { byDate: cancelByDate, loading: cancelLoading, error: cancelError } = useMessCancellationsRange(startDate, endDate);

  const rows = useMemo(() => buildHistoryRows(mealByDate, cancelByDate), [mealByDate, cancelByDate]);

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

  const offByLabel = (offBy: OffBy) => (offBy === 'mess' ? t('history.offByMess') : t('history.offBySelf'));

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('history.title')}</Text>

      {rows.length === 0 ? (
        <Text style={styles.empty}>{t('history.empty')}</Text>
      ) : (
        rows.map((row) => (
          <View key={row.date} style={styles.row}>
            <Text style={styles.date}>{formatDayLabel(row.date, locale)}</Text>
            {row.noonOffBy && (
              <Text style={styles.detail}>{t('common.noon')}: {offByLabel(row.noonOffBy)}</Text>
            )}
            {row.nightOffBy && (
              <Text style={styles.detail}>{t('common.night')}: {offByLabel(row.nightOffBy)}</Text>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#C0392B', fontSize: 15 },
  content: { padding: 16, gap: 12 },
  title: { fontSize: 18, fontWeight: '700', color: '#1F2933' },
  empty: { fontSize: 14, color: '#52606D', marginTop: 24, textAlign: 'center' },
  row: {
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7EB',
    paddingVertical: 10,
    gap: 2,
  },
  date: { fontSize: 14, fontWeight: '700', color: '#1F2933' },
  detail: { fontSize: 13, color: '#52606D' },
});
