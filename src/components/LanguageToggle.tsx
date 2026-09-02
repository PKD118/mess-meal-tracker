import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '@/theme';
import { useLocale } from '@/context/LocaleContext';
import { useAuth } from '@/context/AuthContext';
import { writeOwnLocale } from '@/firebase/mealWrites';

export function LanguageToggle() {
  const { locale, setLocale } = useLocale();
  const { user } = useAuth();

  const handleToggle = async () => {
    const next = locale === 'en' ? 'bn' : 'en';
    await setLocale(next);
    if (user) {
      // Best-effort sync — AsyncStorage on this device is the source of truth,
      // this just keeps the profile record informative for the admin.
      writeOwnLocale(user.uid, next).catch(() => {});
    }
  };

  return (
    <Pressable
      onPress={handleToggle}
      style={styles.button}
      accessibilityRole="button"
      accessibilityLabel={locale === 'en' ? 'Switch to Bangla' : 'Switch to English'}
    >
      <Text style={styles.text}>{locale === 'en' ? 'বাং' : 'EN'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  text: {
    fontSize: 14,
    color: colors.textPrimary,
    fontFamily: fonts.bodySemiBold,
  },
});
