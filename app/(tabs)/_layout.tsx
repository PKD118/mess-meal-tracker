import { Redirect, Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { LanguageToggle } from '@/components/LanguageToggle';

export default function TabsLayout() {
  const { user, authLoading } = useAuth();
  const { t } = useTranslation();

  if (!authLoading && !user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs screenOptions={{ headerRight: () => <LanguageToggle /> }}>
      <Tabs.Screen name="index" options={{ title: t('tabs.dashboard') }} />
      <Tabs.Screen name="planner" options={{ title: t('tabs.planner') }} />
      <Tabs.Screen name="history" options={{ title: t('tabs.history') }} />
    </Tabs>
  );
}
