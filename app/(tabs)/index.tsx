import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { colors, fonts, shadow } from '@/theme';
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
  const monthCount = useMonthToDateCount(user?.uid, profile?.createdAt);

  const [rosterOpen, setRosterOpen] = useState(false);
  const [managerAction, setManagerAction] = useState<{ slot: Slot; type: 'cancel' | 'revert' } | null>(null);

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
  const noonCancelled = roster.cancellation?.noon ?? false;
  const nightCancelled = roster.cancellation?.night ?? false;
  const editableNoon = isSlotEditable(today, 'noon') && !noonCancelled;
  const editableNight = isSlotEditable(today, 'night') && !nightCancelled;

  const handleSaveToday = async (fields: SlotFields) => {
    if (!user) return;
    await writeOwnMealDay({ uid: user.uid, date: today, ...fields });
  };

  // Firestore's messCancellations/{date} doc is already read via a live
  // onSnapshot in useMessRoster on every device — writing here is the only
  // "sync" step needed, every connected app picks it up in real time.
  const handleManagerAction = async () => {
    if (!user || !managerAction) return;
    const { slot, type } = managerAction;
    const cancel = type === 'cancel';
    const already = roster.cancellation;
    await writeMessCancellation({
      date: today,
      setBy: user.uid,
      noon: slot === 'noon' ? cancel : already?.noon ?? false,
      night: slot === 'night' ? cancel : already?.night ?? false,
    });
    setManagerAction(null);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>
        {profile?.name ? t('dashboard.greeting', { name: profile.name }) : t('dashboard.today')}
      </Text>

      <View style={styles.card}>
        <Text style={styles.sectionHeader}>{t('dashboard.today')}</Text>
        <DayMealEditor
          current={current}
          editableNoon={editableNoon}
          editableNight={editableNight}
          noonCancelled={noonCancelled}
          nightCancelled={nightCancelled}
          confirmMessage={t('dialogs.confirmSaveToday')}
          onSave={handleSaveToday}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionHeader}>{t('dashboard.messTotals')}</Text>
        <View style={styles.totalsRow}>
          <View style={styles.totalStatItem}>
            <Ionicons name="restaurant-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.totalStat}>{t('common.noon')}: {roster.noonMessTotal}</Text>
          </View>
          <View style={styles.totalStatItem}>
            <Ionicons name="moon-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.totalStat}>{t('common.night')}: {roster.nightMessTotal}</Text>
          </View>
        </View>

        <Pressable
          onPress={() => setRosterOpen((v) => !v)}
          accessibilityRole="button"
          accessibilityState={{ expanded: rosterOpen }}
          style={styles.linkRow}
        >
          <Text style={styles.link}>{rosterOpen ? t('dashboard.rosterHide') : t('dashboard.roster')}</Text>
          <Ionicons name={rosterOpen ? 'chevron-up' : 'chevron-down'} size={16} color={colors.primary} />
        </Pressable>

        {rosterOpen && (
          <View style={styles.rosterTable}>
            {roster.rows.map((row, i) => {
              const isMe = row.uid === user?.uid;
              return (
                <View
                  key={row.uid}
                  style={[
                    styles.rosterRow,
                    i % 2 === 1 && styles.rosterRowAlt,
                    isMe && styles.rosterRowMe,
                  ]}
                  accessible
                  accessibilityLabel={`${row.name} — ${t('common.noon')} ${row.noonTotal}, ${t('common.night')} ${row.nightTotal}`}
                >
                  <Text style={[styles.rosterName, isMe && styles.rosterNameMe]}>{row.name}</Text>
                  <Text style={styles.rosterValue}>{row.noonTotal}</Text>
                  <Text style={styles.rosterValue}>{row.nightTotal}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.statRow}>
          <View style={styles.statIconWrap}>
            <Ionicons name="restaurant" size={20} color={colors.primary} />
          </View>
          <View style={styles.statTextWrap}>
            <Text style={styles.statNumber}>{monthCount.total}</Text>
            <Text style={styles.statLabel}>{t('dashboard.monthToDate')}</Text>
          </View>
        </View>

        <Pressable onPress={() => router.push('/(tabs)/planner')} style={styles.plannerButton} accessibilityRole="button">
          <Text style={styles.plannerButtonText}>{t('dashboard.plannerButton')}</Text>
        </Pressable>
      </View>

      {profile?.isManager && (
        <View style={styles.managerCard}>
          <Text style={styles.managerTitle}>{t('dashboard.managerCardTitle')}</Text>
          <View style={styles.row}>
            <View style={styles.managerButtonWrap}>
              <Pressable
                onPress={() => !noonCancelled && setManagerAction({ slot: 'noon', type: 'cancel' })}
                onLongPress={() => noonCancelled && setManagerAction({ slot: 'noon', type: 'revert' })}
                delayLongPress={5000}
                style={[styles.managerButton, noonCancelled && styles.managerButtonDone]}
                accessibilityRole="button"
              >
                {noonCancelled && <Ionicons name="checkmark-circle" size={16} color={colors.textSecondary} />}
                <Text style={[styles.managerButtonText, noonCancelled && styles.managerButtonTextDone]}>
                  {noonCancelled ? t('dashboard.cancelledNoon') : t('dashboard.cancelNoon')}
                </Text>
              </Pressable>
              {noonCancelled && <Text style={styles.holdHint}>{t('dashboard.holdToRevert')}</Text>}
            </View>
            <View style={styles.managerButtonWrap}>
              <Pressable
                onPress={() => !nightCancelled && setManagerAction({ slot: 'night', type: 'cancel' })}
                onLongPress={() => nightCancelled && setManagerAction({ slot: 'night', type: 'revert' })}
                delayLongPress={5000}
                style={[styles.managerButton, nightCancelled && styles.managerButtonDone]}
                accessibilityRole="button"
              >
                {nightCancelled && <Ionicons name="checkmark-circle" size={16} color={colors.textSecondary} />}
                <Text style={[styles.managerButtonText, nightCancelled && styles.managerButtonTextDone]}>
                  {nightCancelled ? t('dashboard.cancelledNight') : t('dashboard.cancelNight')}
                </Text>
              </Pressable>
              {nightCancelled && <Text style={styles.holdHint}>{t('dashboard.holdToRevert')}</Text>}
            </View>
          </View>
        </View>
      )}

      {managerAction && (
        <ConfirmDialog
          message={
            managerAction.type === 'cancel'
              ? t('dialogs.managerCancelConfirm', { slot: t(`common.${managerAction.slot}`) })
              : t('dialogs.managerRevertConfirm', { slot: t(`common.${managerAction.slot}`) })
          }
          confirmLabel={t('common.yes')}
          cancelLabel={t('common.no')}
          onConfirm={handleManagerAction}
          onCancel={() => setManagerAction(null)}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.page },
  errorText: { color: colors.danger, fontSize: 15, fontFamily: fonts.bodyMedium },
  content: { padding: 16, gap: 14 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    ...shadow.card,
  },
  sectionHeader: { fontSize: 16, color: colors.textPrimary, fontFamily: fonts.heading },
  totalsRow: { flexDirection: 'row', gap: 24 },
  totalStatItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  totalStat: { fontSize: 16, color: colors.textPrimary, fontFamily: fonts.bodySemiBold },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8 },
  link: { color: colors.primary, fontSize: 14, fontFamily: fonts.bodySemiBold },
  rosterTable: { borderRadius: 10, overflow: 'hidden', borderTopWidth: 1, borderTopColor: colors.border, marginTop: 4 },
  rosterRow: { flexDirection: 'row', gap: 16, paddingVertical: 10, paddingHorizontal: 10 },
  rosterRowAlt: { backgroundColor: colors.surfaceAlt },
  rosterRowMe: { backgroundColor: colors.primarySoft },
  rosterName: { flex: 1, fontSize: 14, color: colors.textPrimary, fontFamily: fonts.body },
  rosterNameMe: { fontFamily: fonts.bodySemiBold, color: colors.primaryDark },
  rosterValue: { width: 40, fontSize: 14, textAlign: 'center', color: colors.textPrimary, fontFamily: fonts.bodyMedium },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTextWrap: { flex: 1 },
  statNumber: { fontSize: 24, color: colors.textPrimary, fontFamily: fonts.headingBold },
  statLabel: { fontSize: 13, color: colors.textSecondary, fontFamily: fonts.body },
  plannerButton: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plannerButtonText: { color: colors.textOnPrimary, fontSize: 15, fontFamily: fonts.bodySemiBold },
  managerCard: {
    borderWidth: 1,
    borderColor: colors.warningBorder,
    backgroundColor: colors.warningSoft,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    ...shadow.card,
  },
  managerTitle: { fontSize: 14, color: colors.warning, fontFamily: fonts.heading },
  row: { flexDirection: 'row', gap: 12 },
  managerButtonWrap: { flex: 1, gap: 4 },
  holdHint: { fontSize: 11, color: colors.textSecondary, fontFamily: fonts.body, textAlign: 'center' },
  managerButton: {
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: colors.warningBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  managerButtonDone: { backgroundColor: colors.surfaceAlt },
  managerButtonText: { fontSize: 14, color: colors.textPrimary, fontFamily: fonts.bodySemiBold },
  managerButtonTextDone: { color: colors.textSecondary },
  greeting: { fontSize: 22, color: colors.textPrimary, fontFamily: fonts.headingBold, paddingHorizontal: 2 },
});
