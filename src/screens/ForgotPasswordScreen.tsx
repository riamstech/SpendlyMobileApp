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
  const responsiveStyles = {
    logo: { width: 80 * scale, height: 80 * scale },
    headerSubtitle: { fontSize: Math.max(12, Math.min(14 * scale, 16)) },
    label: { fontSize: Math.max(13, Math.min(14 * scale, 15)) },
    input: { fontSize: Math.max(14, Math.min(16 * scale, 18)) },
    errorText: { fontSize: Math.max(11, Math.min(12 * scale, 13)) },
    buttonText: { fontSize: Math.max(14, Math.min(16 * scale, 18)) },
    hintText: { fontSize: Math.max(12, Math.min(13 * scale, 14)) },
    successTitle: { fontSize: Math.max(18, Math.min(20 * scale, 22)) },
    successText: { fontSize: Math.max(13, Math.min(14 * scale, 16)) },
    linkText: { fontSize: Math.max(13, Math.min(14 * scale, 15)) },
    formPadding: Math.max(16, Math.min(20 * scale, 24)),
    inputPadding: Math.max(12, Math.min(14 * scale, 16)),
    buttonPadding: Math.max(14, Math.min(16 * scale, 18)),
  };

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
                    padding: responsiveStyles.formPadding,
                    maxWidth: isLargeScreen ? 430 : '100%',
                  },
                ]}
              >
                <View style={styles.successIconContainer}>
                  <CheckCircle size={48 * scale} color="#4CAF50" />
                </View>
                <Text style={[styles.successTitle, responsiveStyles.successTitle]}>
                  Check Your Email
                </Text>
                <Text style={[styles.successText, responsiveStyles.successText, { marginTop: 8 }]}>
                  We've sent a password reset link to
                </Text>
                <Text style={[styles.successEmail, responsiveStyles.successText, { marginTop: 8, marginBottom: 16 }]}>
                  {email}
                </Text>
                <Text style={[styles.successText, responsiveStyles.successText, { marginBottom: 24 }]}>
                  Click the link in the email to reset your password. If you don't see it, check your spam folder.
                </Text>
                <Pressable
                  style={[
                    styles.primaryButton,
                    { paddingVertical: responsiveStyles.buttonPadding },
                    isLoading && styles.primaryButtonDisabled,
                  ]}
                  onPress={onBackToLogin}
                  disabled={isLoading}
                >
                  <Text style={[styles.primaryButtonText, responsiveStyles.buttonText]}>
                    Back to Login
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.tryAgainButton}
                  onPress={() => setSubmitted(false)}
                >
                  <Text style={[styles.tryAgainText, responsiveStyles.linkText]}>
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
                style={responsiveStyles.logo}
                resizeMode="contain"
              />
              <Text style={[styles.headerTitle, responsiveTextStyles.h3]}>
                Forgot Password?
              </Text>
              <Text style={[styles.headerSubtitle, responsiveStyles.headerSubtitle]}>
                No worries, we'll send you reset instructions
              </Text>
            </View>

            {/* Reset Password Form */}
            <View
              style={[
                styles.formContainer,
                {
                  padding: responsiveStyles.formPadding,
                  maxWidth: isLargeScreen ? 430 : '100%',
                },
              ]}
            >
              {/* Email Field */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, responsiveStyles.label]}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <Mail
                    size={Math.max(18, Math.min(20 * scale, 22))}
                    color="#9CA3AF"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      responsiveStyles.input,
                      { paddingVertical: responsiveStyles.inputPadding },
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
                  <Text style={[styles.errorText, responsiveStyles.errorText]}>
                    {errors.email}
                  </Text>
                )}
                <Text style={[styles.hintText, responsiveStyles.hintText, { marginTop: 4 }]}>
                  Enter the email address associated with your account
                </Text>
              </View>

              {/* Submit Button */}
              <Pressable
                style={[
                  styles.primaryButton,
                  { paddingVertical: responsiveStyles.buttonPadding },
                  isLoading && styles.primaryButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                <Text style={[styles.primaryButtonText, responsiveStyles.buttonText]}>
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
                <Text style={[styles.backButtonText, responsiveStyles.buttonText]}>
                  Back to Login
                </Text>
              </Pressable>
            </View>

            {/* Footer */}
            <Text style={[styles.footerText, responsiveStyles.hintText]}>
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
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
  },
  headerSubtitle: {
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
    fontWeight: 'bold',
    color: '#212121',
    textAlign: 'center',
  },
  successText: {
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  successEmail: {
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
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    flex: 1,
    paddingHorizontal: 40,
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
    color: '#FF5252',
  },
  hintText: {
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
    fontWeight: 'bold',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#03A9F4',
    fontWeight: '600',
  },
  tryAgainButton: {
    marginTop: 16,
  },
  tryAgainText: {
    color: '#03A9F4',
    textAlign: 'center',
    fontWeight: '600',
  },
  footerText: {
    marginTop: 24,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.9)',
  },
});

