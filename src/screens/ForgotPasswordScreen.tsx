import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../api/services/auth';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { textStyles, createResponsiveTextStyles } from '../constants/fonts';
import { showToast } from '../utils/toast';

interface ForgotPasswordScreenProps {
  onBackToLogin?: () => void;
}

export default function ForgotPasswordScreen({
  onBackToLogin,
}: ForgotPasswordScreenProps = {}) {
  const { t } = useTranslation('common');
  const { width, height } = useWindowDimensions();
  const { isDark, colors } = useTheme();
  const responsiveTextStyles = createResponsiveTextStyles(width);
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ email?: string }>({});
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Responsive scaling
  const scale = Math.min(width / 375, height / 812);
  const isSmallScreen = width < 375;
  const isLargeScreen = width > 430;

  const validateForm = () => {
    const newErrors: { email?: string } = {};

    if (!email) {
      newErrors.email = t('auth.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t('auth.emailInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      await authService.forgotPassword({ email });
      setSubmitted(true);
    } catch (error: any) {
      console.error('Forgot password failed', error);
      const message =
        error?.response?.data?.message ||
        'Failed to send reset email. Please try again.';
      showToast.error(message, 'Error');
    } finally {
      setIsLoading(false);
    }
  };

  // Responsive styles
  const gradientColors: [string, string] = isDark 
    ? ['#1a1a1a', '#2a2a2a'] 
    : ['#03A9F4', '#0288D1'];

  // Success state
  if (submitted) {
    return (
      <LinearGradient
        colors={gradientColors}
        style={styles.gradient}
      >
        <StatusBar style={isDark ? "dark" : "light"} />
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
          >
            <ScrollView
              contentContainerStyle={[
                styles.scrollContent,
                {
                  paddingHorizontal: isSmallScreen ? 16 : 24,
                  paddingVertical: isSmallScreen ? 16 : 24,
                },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View
                style={[
                  styles.formContainer,
                  styles.successContainer,
                  {
                    maxWidth: isLargeScreen ? 430 : '100%',
                    padding: 20,
                    backgroundColor: colors.card,
                  },
                ]}
              >
                <View style={[styles.successIconContainer, { backgroundColor: isDark ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)' }]}>
                  <CheckCircle size={48 * scale} color="#4CAF50" />
                </View>
                <Text style={[styles.successTitle, responsiveTextStyles.h3, { color: colors.foreground }]}>
                  {t('auth.checkYourEmail')}
                </Text>
                <Text style={[styles.successText, responsiveTextStyles.body, { marginTop: 8, color: colors.mutedForeground }]}>
                  {t('auth.resetEmailSent')}
                </Text>
                <Text style={[styles.successEmail, responsiveTextStyles.body, { marginTop: 8, marginBottom: 16, color: colors.foreground }]}>
                  {email}
                </Text>
                <Text style={[styles.successText, responsiveTextStyles.body, { marginBottom: 24, color: colors.mutedForeground }]}>
                  {t('auth.resetEmailInstructions')}
                </Text>
                <Pressable
                  style={[
                    styles.primaryButton,
                    { paddingVertical: 14 },
                    isLoading && styles.primaryButtonDisabled,
                  ]}
                  onPress={onBackToLogin}
                  disabled={isLoading}
                >
                  <Text style={[styles.primaryButtonText, responsiveTextStyles.button]}>
                    {t('auth.backToLogin')}
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.tryAgainButton}
                  onPress={() => setSubmitted(false)}
                >
                  <Text style={[styles.tryAgainText, responsiveTextStyles.bodySmall, { color: colors.primary }]}>
                    {t('auth.tryAgain')}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Form state
  return (
    <LinearGradient
      colors={gradientColors}
      style={styles.gradient}
    >
      <StatusBar style={isDark ? "dark" : "light"} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingHorizontal: isSmallScreen ? 16 : 24,
                paddingVertical: isSmallScreen ? 16 : 24,
              },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Logo + Header */}
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/logo-dark.png')}
                style={{ width: 80 * scale, height: 80 * scale }}
                resizeMode="contain"
              />
              <Text style={[styles.headerTitle, responsiveTextStyles.h3, { color: isDark ? colors.foreground : '#fff' }]}>
                {t('auth.forgotPasswordTitle')}
              </Text>
              <Text style={[styles.headerSubtitle, responsiveTextStyles.body, { color: isDark ? colors.mutedForeground : 'rgba(255, 255, 255, 0.9)' }]}>
                {t('auth.forgotPasswordSubtitle')}
              </Text>
            </View>

            {/* Reset Password Form */}
            <View
              style={[
                styles.formContainer,
                {
                  padding: 20,
                  maxWidth: isLargeScreen ? 430 : '100%',
                  backgroundColor: colors.card,
                },
              ]}
            >
              {/* Email Field */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, responsiveTextStyles.label, { color: colors.foreground }]}>{t('auth.email')}</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                  <Mail
                    size={Math.max(18, Math.min(20 * scale, 22))}
                    color={colors.mutedForeground}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      responsiveTextStyles.body,
                      { paddingVertical: 14, color: colors.foreground },
                      errors.email && styles.inputError,
                    ]}
                    placeholder={t('auth.emailPlaceholder')}
                    placeholderTextColor={colors.mutedForeground}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (errors.email) setErrors({ email: undefined });
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>
                {errors.email && (
                  <Text style={[styles.errorText, responsiveTextStyles.caption, { color: colors.destructive }]}>
                    {errors.email}
                  </Text>
                )}
                <Text style={[styles.hintText, responsiveTextStyles.caption, { marginTop: 4, color: colors.mutedForeground }]}>
                  {t('auth.emailHint')}
                </Text>
              </View>

              {/* Submit Button */}
              <Pressable
                style={[
                  styles.primaryButton,
                  { paddingVertical: 14 },
                  isLoading && styles.primaryButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                <Text style={[styles.primaryButtonText, responsiveTextStyles.button]}>
                  {isLoading ? t('auth.sending') : t('auth.sendResetLink')}
                </Text>
              </Pressable>

              {/* Back to Login */}
              <Pressable
                style={styles.backButton}
                onPress={onBackToLogin}
              >
                <ArrowLeft
                  size={Math.max(16, Math.min(18 * scale, 20))}
                  color={colors.primary}
                  style={{ marginRight: 8 }}
                />
                <Text style={[styles.backButtonText, responsiveTextStyles.button, { color: colors.primary }]}>
                  {t('auth.backToLogin')}
                </Text>
              </Pressable>
            </View>

            {/* Footer */}
            <Text style={[styles.footerText, responsiveTextStyles.caption, { color: isDark ? colors.mutedForeground : 'rgba(255,255,255,0.9)' }]}>
              {t('footer.tagline')} {t('footer.copyright')}
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerTitle: {
    ...textStyles.h3,
    marginTop: 8,
    marginBottom: 4,
  },
  headerSubtitle: {
    ...textStyles.body,
  },
  formContainer: {
    borderRadius: 20,
    width: '100%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    padding: 24,
  },
  successContainer: {
    alignItems: 'center',
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    ...textStyles.h3,
    textAlign: 'center',
  },
  successText: {
    ...textStyles.body,
    textAlign: 'center',
    lineHeight: 20,
  },
  successEmail: {
    ...textStyles.body,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  label: {
    ...textStyles.label,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    flex: 1,
    paddingHorizontal: 40,
    ...textStyles.body,
  },
  inputIcon: {
    position: 'absolute',
    left: 14,
  },
  inputError: {
    borderColor: '#FF5252',
  },
  errorText: {
    marginTop: 4,
    ...textStyles.caption,
  },
  hintText: {
    ...textStyles.caption,
  },
  primaryButton: {
    backgroundColor: '#03A9F4',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#03A9F4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#fff',
    ...textStyles.button,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    ...textStyles.button,
  },
  tryAgainButton: {
    marginTop: 16,
  },
  tryAgainText: {
    textAlign: 'center',
    ...textStyles.bodySmall,
  },
  footerText: {
    marginTop: 24,
    textAlign: 'center',
    ...textStyles.caption,
  },
});

