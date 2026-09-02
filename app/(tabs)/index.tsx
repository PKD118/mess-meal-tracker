import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useOwnMealDays } from '@/hooks/useOwnMealDays';
import { useMessRoster } from '@/hooks/useMessRoster';
import { useMonthToDateCount } from '@/hooks/useMonthToDateCount';
import { DayMealEditor } from '@/components/DayMealEditor';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { writeOwnMealDay, writeMessCancellation } from '@/firebase/mealWrites';
import { todayDhakaISO, isSlotEditable } from '@/utils/cutoff';
import type { Slot } from '@/types/models';
import type { SlotFields } from '@/hooks/useMealSlotEditor';

const DEFAULT_FIELDS: SlotFields = { noon: false, night: false, noonGuests: 0, nightGuests: 0 };

export default function DashboardScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, profile } = useAuth();
  const today = todayDhakaISO();

  const { byDate, loading: mealLoading, error: mealError } = useOwnMealDays(user?.uid, today, today);
  const roster = useMessRoster(today);
  const monthCount = useMonthToDateCount(user?.uid);

  const [rosterOpen, setRosterOpen] = useState(false);
  const [managerConfirmSlot, setManagerConfirmSlot] = useState<Slot | null>(null);

  const loading = mealLoading || roster.loading || monthCount.loading;
  const error = mealError ?? roster.error ?? monthCount.error;

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

  const current = byDate[today] ?? DEFAULT_FIELDS;
  const editableNoon = isSlotEditable(today, 'noon');
  const editableNight = isSlotEditable(today, 'night');

  const handleSaveToday = async (fields: SlotFields) => {
    if (!user) return;
    await writeOwnMealDay({ uid: user.uid, date: today, ...fields });
  };

  const handleManagerCancel = async (slot: Slot) => {
    if (!user) return;
    const already = roster.cancellation;
    await writeMessCancellation({
      date: today,
      setBy: user.uid,
      noon: slot === 'noon' ? true : already?.noon ?? false,
      night: slot === 'night' ? true : already?.night ?? false,
    });
    setManagerConfirmSlot(null);
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.sectionHeader}>{t('dashboard.today')}</Text>
      <DayMealEditor
        current={current}
        editableNoon={editableNoon}
        editableNight={editableNight}
        confirmMessage={t('dialogs.confirmSaveToday')}
        onSave={handleSaveToday}
      />

      <View style={styles.divider} />

      <Text style={styles.sectionHeader}>{t('dashboard.messTotals')}</Text>
      <View style={styles.totalsRow}>
        <Text style={styles.totalStat}>🍽 {t('common.noon')}: {roster.noonMessTotal}</Text>
        <Text style={styles.totalStat}>🌙 {t('common.night')}: {roster.nightMessTotal}</Text>
      </View>

      <Pressable
        onPress={() => setRosterOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: rosterOpen }}
      >
        <Text style={styles.link}>{rosterOpen ? t('dashboard.rosterHide') : t('dashboard.roster')}</Text>
      </Pressable>

      {rosterOpen && (
        <View style={styles.rosterTable}>
          {roster.rows.map((row) => (
            <View
              key={row.uid}
              style={styles.rosterRow}
              accessible
              accessibilityLabel={`${row.name} — ${t('common.noon')} ${row.noonTotal}, ${t('common.night')} ${row.nightTotal}`}
            >
              <Text style={styles.rosterName}>{row.name}</Text>
              <Text style={styles.rosterValue}>{row.noonTotal}</Text>
              <Text style={styles.rosterValue}>{row.nightTotal}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.divider} />

      <Text style={styles.monthStat}>
        {t('dashboard.monthToDate')}: {monthCount.total} {t('dashboard.meals')}
      </Text>

      <Pressable onPress={() => router.push('/(tabs)/planner')} style={styles.plannerButton} accessibilityRole="button">
        <Text style={styles.plannerButtonText}>{t('dashboard.plannerButton')}</Text>
      </Pressable>

      {profile?.isManager && (
        <View style={styles.managerCard}>
          <Text style={styles.managerTitle}>{t('dashboard.managerCardTitle')}</Text>
          <View style={styles.row}>
            <Pressable onPress={() => setManagerConfirmSlot('noon')} style={styles.managerButton} accessibilityRole="button">
              <Text style={styles.managerButtonText}>{t('dashboard.cancelNoon')}</Text>
            </Pressable>
            <Pressable onPress={() => setManagerConfirmSlot('night')} style={styles.managerButton} accessibilityRole="button">
              <Text style={styles.managerButtonText}>{t('dashboard.cancelNight')}</Text>
            </Pressable>
          </View>
        </View>
      )}

      {managerConfirmSlot && (
        <ConfirmDialog
          message={t('dialogs.managerCancelConfirm', { slot: t(`common.${managerConfirmSlot}`) })}
          confirmLabel={t('common.yes')}
          cancelLabel={t('common.no')}
          onConfirm={() => handleManagerCancel(managerConfirmSlot)}
          onCancel={() => setManagerConfirmSlot(null)}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#C0392B', fontSize: 15 },
  content: { padding: 16, gap: 12 },
  sectionHeader: { fontSize: 16, fontWeight: '700', color: '#1F2933' },
  divider: { height: 1, backgroundColor: '#E4E7EB', marginVertical: 8 },
  totalsRow: { flexDirection: 'row', gap: 24 },
  totalStat: { fontSize: 16, fontWeight: '600', color: '#1F2933' },
  link: { color: '#1F6FEB', fontSize: 14, fontWeight: '600', paddingVertical: 8 },
  rosterTable: { gap: 6 },
  rosterRow: { flexDirection: 'row', gap: 16, paddingVertical: 4 },
  rosterName: { flex: 1, fontSize: 14, color: '#1F2933' },
  rosterValue: { width: 40, fontSize: 14, textAlign: 'center', color: '#1F2933' },
  monthStat: { fontSize: 15, fontWeight: '600', color: '#1F2933' },
  plannerButton: {
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: '#1F2933',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plannerButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  managerCard: {
    borderWidth: 1,
    borderColor: '#F0B429',
    backgroundColor: '#FFFBEA',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  managerTitle: { fontSize: 14, fontWeight: '700', color: '#8D5B00' },
  row: { flexDirection: 'row', gap: 12 },
  managerButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: '#F0B429',
    alignItems: 'center',
    justifyContent: 'center',
  },
  managerButtonText: { fontSize: 14, fontWeight: '600', color: '#1F2933' },
});
