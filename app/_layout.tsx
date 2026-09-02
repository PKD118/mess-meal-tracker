import '@/i18n';
import React from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { Lexend_600SemiBold, Lexend_700Bold } from '@expo-google-fonts/lexend';
import { AuthProvider } from '@/context/AuthContext';
import { LocaleProvider } from '@/context/LocaleContext';
import { fonts } from '@/theme';

// Applies the body font to every <Text> by default so screens don't each
// need to set fontFamily explicitly — non-Latin glyphs (Bangla) still fall
// back to the OS font automatically since Inter has no Bangla coverage.
// Fixed assignment (not "wrap whatever was there before") — this module runs
// on every Fast Refresh in dev, and appending to the previous value each time
// would grow an unbounded nested style array across a long dev session.
const defaultTextProps = Text as unknown as { defaultProps?: { style?: unknown } };
defaultTextProps.defaultProps = { style: { fontFamily: fonts.body } };

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Lexend_600SemiBold,
    Lexend_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <LocaleProvider>
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </AuthProvider>
      </LocaleProvider>
    </SafeAreaProvider>
  );
}
