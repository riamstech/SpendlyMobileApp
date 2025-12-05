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
  Alert,
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
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
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
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  // Responsive styles


  // Success state
  if (submitted) {
    return (
      <LinearGradient
        colors={['#03A9F4', '#0288D1']}
        style={styles.gradient}
      >
        <StatusBar style="light" />
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
                  },
                ]}
              >
                <View style={styles.successIconContainer}>
                  <CheckCircle size={48 * scale} color="#4CAF50" />
                </View>
                <Text style={[styles.successTitle, responsiveTextStyles.h3]}>
                  Check Your Email
                </Text>
                <Text style={[styles.successText, responsiveTextStyles.body, { marginTop: 8 }]}>
                  We've sent a password reset link to
                </Text>
                <Text style={[styles.successEmail, responsiveTextStyles.body, { marginTop: 8, marginBottom: 16 }]}>
                  {email}
                </Text>
                <Text style={[styles.successText, responsiveTextStyles.body, { marginBottom: 24 }]}>
                  Click the link in the email to reset your password. If you don't see it, check your spam folder.
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
                    Back to Login
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.tryAgainButton}
                  onPress={() => setSubmitted(false)}
                >
                  <Text style={[styles.tryAgainText, responsiveTextStyles.bodySmall]}>
                    Didn't receive the email? Try again
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
      colors={['#03A9F4', '#0288D1']}
      style={styles.gradient}
    >
      <StatusBar style="light" />
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
              <Text style={[styles.headerTitle, responsiveTextStyles.h3]}>
                Forgot Password?
              </Text>
              <Text style={[styles.headerSubtitle, responsiveTextStyles.body]}>
                No worries, we'll send you reset instructions
              </Text>
            </View>

            {/* Reset Password Form */}
            <View
              style={[
                styles.formContainer,
                {
                  padding: 20,
                  maxWidth: isLargeScreen ? 430 : '100%',
                },
              ]}
            >
              {/* Email Field */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, responsiveTextStyles.label]}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <Mail
                    size={Math.max(18, Math.min(20 * scale, 22))}
                    color="#9CA3AF"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      responsiveTextStyles.body,
                      { paddingVertical: 14 },
                      errors.email && styles.inputError,
                    ]}
                    placeholder="you@example.com"
                    placeholderTextColor="#9CA3AF"
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
                  <Text style={[styles.errorText, responsiveTextStyles.caption]}>
                    {errors.email}
                  </Text>
                )}
                <Text style={[styles.hintText, responsiveTextStyles.caption, { marginTop: 4 }]}>
                  Enter the email address associated with your account
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
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Text>
              </Pressable>

              {/* Back to Login */}
              <Pressable
                style={styles.backButton}
                onPress={onBackToLogin}
              >
                <ArrowLeft
                  size={Math.max(16, Math.min(18 * scale, 20))}
                  color="#03A9F4"
                  style={{ marginRight: 8 }}
                />
                <Text style={[styles.backButtonText, responsiveTextStyles.button]}>
                  Back to Login
                </Text>
              </Pressable>
            </View>

            {/* Footer */}
            <Text style={[styles.footerText, responsiveTextStyles.caption]}>
              Track. Save. Grow. © 2024 Spendly
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
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
  },
  headerSubtitle: {
    ...textStyles.body,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
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
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    ...textStyles.h3,
    color: '#212121',
    textAlign: 'center',
  },
  successText: {
    ...textStyles.body,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  successEmail: {
    ...textStyles.body,
    color: '#212121',
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
    borderColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
  },
  label: {
    ...textStyles.label,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    flex: 1,
    paddingHorizontal: 40,
    ...textStyles.body,
    color: '#333',
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
    color: '#FF5252',
  },
  hintText: {
    ...textStyles.caption,
    color: '#666',
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
    color: '#03A9F4',
    ...textStyles.button,
  },
  tryAgainButton: {
    marginTop: 16,
  },
  tryAgainText: {
    color: '#03A9F4',
    textAlign: 'center',
    ...textStyles.bodySmall,
  },
  footerText: {
    marginTop: 24,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.9)',
    ...textStyles.caption,
  },
});

