import React, { useState, useEffect } from 'react';
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
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { textStyles, createResponsiveTextStyles } from '../constants/fonts';

interface ResetPasswordScreenProps {
  token?: string;
  email?: string;
  onBackToLogin?: () => void;
}

export default function ResetPasswordScreen({
  token: initialToken,
  email: initialEmail,
  onBackToLogin,
}: ResetPasswordScreenProps = {}) {
  const { t } = useTranslation('common');
  const { width, height } = useWindowDimensions();
  const { isDark, colors } = useTheme();
  const responsiveTextStyles = createResponsiveTextStyles(width);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; passwordConfirmation?: string }>({});
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState(initialToken || '');
  const [email, setEmail] = useState(initialEmail || '');

  // Responsive scaling
  const scale = Math.min(width / 375, height / 812);
  const isSmallScreen = width < 375;
  const isLargeScreen = width > 430;

  useEffect(() => {
    // In React Native, token and email should be passed as props or via deep linking
    // For now, if not provided, show error
    if (!token || !email) {
      Alert.alert(
        'Invalid Link',
        'Invalid password reset link. Please request a new one.',
        [
          {
            text: 'OK',
            onPress: () => {
              if (onBackToLogin) {
                onBackToLogin();
              }
            },
          },
        ]
      );
    }
  }, [token, email, onBackToLogin]);

  const validateForm = () => {
    const newErrors: { password?: string; passwordConfirmation?: string } = {};

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!passwordConfirmation) {
      newErrors.passwordConfirmation = 'Please confirm your password';
    } else if (password !== passwordConfirmation) {
      newErrors.passwordConfirmation = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !token || !email) return;

    try {
      setIsLoading(true);
      await authService.resetPassword({
        email,
        token,
        password,
        password_confirmation: passwordConfirmation,
      });
      setSubmitted(true);
    } catch (error: any) {
      console.error('Reset password failed', error);
      const message =
        error?.response?.data?.message ||
        'Failed to reset password. The link may have expired. Please request a new one.';
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
    emailDisplay: { fontSize: Math.max(13, Math.min(14 * scale, 16)) },
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
                  Password Reset Successful!
                </Text>
                <Text style={[styles.successText, responsiveStyles.successText, { marginTop: 8, marginBottom: 8 }]}>
                  Your password has been reset successfully.
                </Text>
                <Text style={[styles.successText, responsiveStyles.successText, { marginBottom: 24 }]}>
                  You can now log in with your new password.
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
                Reset Password
              </Text>
              <Text style={[styles.headerSubtitle, responsiveStyles.headerSubtitle]}>
                Enter your new password below
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
              {/* Email Display (read-only) */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, responsiveStyles.label]}>Email Address</Text>
                <View style={styles.emailDisplayContainer}>
                  <Text style={[styles.emailDisplay, responsiveStyles.emailDisplay]}>
                    {email || 'Not provided'}
                  </Text>
                </View>
              </View>

              {/* New Password Field */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, responsiveStyles.label]}>New Password</Text>
                <View style={styles.inputWrapper}>
                  <Lock
                    size={Math.max(18, Math.min(20 * scale, 22))}
                    color="#9CA3AF"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      responsiveStyles.input,
                      { paddingVertical: responsiveStyles.inputPadding },
                      errors.password && styles.inputError,
                    ]}
                    placeholder="Enter new password"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errors.password) setErrors({ ...errors, password: undefined });
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    {showPassword ? (
                      <EyeOff
                        size={Math.max(18, Math.min(20 * scale, 22))}
                        color="#9CA3AF"
                      />
                    ) : (
                      <Eye
                        size={Math.max(18, Math.min(20 * scale, 22))}
                        color="#9CA3AF"
                      />
                    )}
                  </Pressable>
                </View>
                {errors.password && (
                  <Text style={[styles.errorText, responsiveStyles.errorText]}>
                    {errors.password}
                  </Text>
                )}
                <Text style={[styles.hintText, responsiveStyles.hintText, { marginTop: 4 }]}>
                  Must be at least 8 characters
                </Text>
              </View>

              {/* Confirm Password Field */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, responsiveStyles.label]}>Confirm Password</Text>
                <View style={styles.inputWrapper}>
                  <Lock
                    size={Math.max(18, Math.min(20 * scale, 22))}
                    color="#9CA3AF"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      responsiveStyles.input,
                      { paddingVertical: responsiveStyles.inputPadding },
                      errors.passwordConfirmation && styles.inputError,
                    ]}
                    placeholder="Confirm new password"
                    placeholderTextColor="#9CA3AF"
                    value={passwordConfirmation}
                    onChangeText={(text) => {
                      setPasswordConfirmation(text);
                      if (errors.passwordConfirmation) setErrors({ ...errors, passwordConfirmation: undefined });
                    }}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <Pressable
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                  >
                    {showConfirmPassword ? (
                      <EyeOff
                        size={Math.max(18, Math.min(20 * scale, 22))}
                        color="#9CA3AF"
                      />
                    ) : (
                      <Eye
                        size={Math.max(18, Math.min(20 * scale, 22))}
                        color="#9CA3AF"
                      />
                    )}
                  </Pressable>
                </View>
                {errors.passwordConfirmation && (
                  <Text style={[styles.errorText, responsiveStyles.errorText]}>
                    {errors.passwordConfirmation}
                  </Text>
                )}
              </View>

              {/* Submit Button */}
              <Pressable
                style={[
                  styles.primaryButton,
                  { paddingVertical: responsiveStyles.buttonPadding },
                  isLoading && styles.primaryButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={isLoading || !token || !email}
              >
                <Text style={[styles.primaryButtonText, responsiveStyles.buttonText]}>
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </Text>
              </Pressable>

              {/* Back to Login */}
              <Pressable
                style={styles.backButton}
                onPress={onBackToLogin}
              >
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
    marginTop: 16,
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
  emailDisplayContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  emailDisplay: {
    color: '#666',
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
  eyeIcon: {
    position: 'absolute',
    right: 14,
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
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#03A9F4',
    fontWeight: '600',
  },
  footerText: {
    marginTop: 24,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.9)',
  },
});

