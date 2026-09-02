import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  AccessibilityInfo,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { login } from '@/firebase/auth';
import { LanguageToggle } from '@/components/LanguageToggle';

export default function LoginScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch {
      const message = t('login.error');
      setError(message);
      // accessibilityLiveRegion is unreliable on iOS — announce explicitly
      // so VoiceOver users don't miss a failed-login error.
      AccessibilityInfo.announceForAccessibility(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.topBar}>
        <LanguageToggle />
      </View>
      <View style={styles.content}>
        <Text style={styles.title} accessibilityRole="header">
          {t('common.appName')}
        </Text>

        <Text style={styles.label}>{t('login.email')}</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          keyboardType="email-address"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          accessibilityLabel={t('login.email')}
        />

        <Text style={styles.label}>{t('login.password')}</Text>
        <TextInput
          ref={passwordRef}
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          secureTextEntry
          autoComplete="password"
          textContentType="password"
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
          accessibilityLabel={t('login.password')}
        />

        {error ? (
          <Text style={styles.error} accessibilityLiveRegion="assertive">
            {error}
          </Text>
        ) : null}

        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          style={[styles.button, submitting && styles.buttonDisabled]}
          accessibilityRole="button"
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('login.submit')}</Text>}
        </Pressable>

        <Text style={styles.footer}>{t('login.contactManager')}</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  topBar: { alignItems: 'flex-end', padding: 12 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, gap: 8 },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 24, color: '#1F2933' },
  label: { fontSize: 14, color: '#52606D', marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#CBD2D9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 44,
  },
  error: { color: '#C0392B', marginTop: 12, fontSize: 14 },
  button: {
    backgroundColor: '#1F6FEB',
    borderRadius: 8,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  footer: { textAlign: 'center', marginTop: 24, color: '#52606D', fontSize: 13 },
});
