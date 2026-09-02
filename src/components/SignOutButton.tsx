import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '@/theme';
import { logout } from '@/firebase/auth';

export function SignOutButton() {
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={() => logout()}
      style={styles.button}
      accessibilityRole="button"
      accessibilityLabel={t('common.signOut')}
    >
      <Ionicons name="log-out-outline" size={20} color={colors.textPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
});
