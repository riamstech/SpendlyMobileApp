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
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { textStyles, createResponsiveTextStyles } from '../constants/fonts';

interface LoginScreenProps {
  onLoginSuccess?: () => void;
  onSignupClick?: () => void;
  onForgotPasswordClick?: () => void;
}

export default function LoginScreen({ onLoginSuccess, onSignupClick, onForgotPasswordClick }: LoginScreenProps = {}) {
  const { t } = useTranslation('common');
  const { width, height } = useWindowDimensions();
  const { isDark, colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Responsive scaling factors
  const scale = Math.min(width / 375, height / 812); // Base: iPhone X (375x812)
  const isSmallScreen = width < 375;
  const isLargeScreen = width > 430;

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = t('auth.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t('auth.emailInvalid');
    }

    if (!password) {
      newErrors.password = t('auth.passwordRequired');
    } else if (password.length < 6) {
      newErrors.password = t('auth.passwordMin');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      const deviceName = `${Platform.OS} ${Platform.Version} - React Native`;
      const response = await authService.login({ 
        email, 
        password,
        device_name: deviceName
      });
      // Navigate to Dashboard on successful login
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (error: any) {
      console.error('Login failed', error);
      const message =
        error?.response?.data?.message ||
        'Login failed. Please check your credentials and try again.';
      Alert.alert('Login failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    Alert.alert('Google login', 'Continue with Google will be wired here.');
  };

  // Responsive styles
  const responsiveStyles = {
    logo: { width: 80 * scale, height: 80 * scale },
    appName: { fontSize: Math.max(14, Math.min(16 * scale, 16)) },
    tagline: { fontSize: Math.max(13, Math.min(15 * scale, 16)) },
    label: { fontSize: Math.max(13, Math.min(14 * scale, 15)) },
    input: { fontSize: Math.max(14, Math.min(16 * scale, 16)) },
    errorText: { fontSize: Math.max(11, Math.min(12 * scale, 13)) },
    forgotPasswordText: { fontSize: Math.max(13, Math.min(14 * scale, 15)) },
    buttonText: { fontSize: Math.max(14, Math.min(16 * scale, 16)) },
    dividerText: { fontSize: Math.max(12, Math.min(13 * scale, 14)) },
    googleButtonText: { fontSize: Math.max(14, Math.min(15 * scale, 16)) },
    signupText: { fontSize: Math.max(13, Math.min(14 * scale, 15)) },
    footerText: { fontSize: Math.max(12, Math.min(13 * scale, 14)) },
    formPadding: Math.max(16, Math.min(20 * scale, 24)),
    inputPadding: Math.max(12, Math.min(14 * scale, 16)),
    buttonPadding: Math.max(14, Math.min(16 * scale, 18)),
  };

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
              { paddingHorizontal: isSmallScreen ? 16 : 24, paddingVertical: isSmallScreen ? 16 : 24 }
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
          {/* Logo + headings (match web as close as possible) */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/logo-dark.png')}
              style={responsiveStyles.logo}
              resizeMode="contain"
            />
            <Text style={[styles.appName, responsiveStyles.appName]}>{t('auth.welcomeBack')}</Text>
            <Text style={[styles.tagline, responsiveStyles.tagline]}>{t('auth.loginSubtitle')}</Text>
          </View>

          {/* Login Form */}
          <View style={[
            styles.formContainer,
            {
              padding: responsiveStyles.formPadding,
              maxWidth: isLargeScreen ? 430 : '100%',
              width: isSmallScreen ? '100%' : '100%',
              backgroundColor: colors.card,
            }
          ]}>
            {/* Email Address */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, responsiveStyles.label, { color: colors.foreground }]}>{t('auth.email')}</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                <Mail size={Math.max(18, Math.min(20 * scale, 22))} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[
                    styles.input,
                    responsiveStyles.input,
                    { paddingVertical: responsiveStyles.inputPadding, color: colors.foreground },
                    errors.email && styles.inputError
                  ]}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.mutedForeground}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
              {errors.email && <Text style={[styles.errorText, responsiveStyles.errorText, { color: colors.destructive }]}>{errors.email}</Text>}
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, responsiveStyles.label, { color: colors.foreground }]}>{t('auth.password')}</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                <Lock size={Math.max(18, Math.min(20 * scale, 22))} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[
                    styles.input,
                    responsiveStyles.input,
                    { paddingVertical: responsiveStyles.inputPadding, color: colors.foreground },
                    errors.password && styles.inputError
                  ]}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.mutedForeground}
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
                    <EyeOff size={Math.max(18, Math.min(20 * scale, 22))} color={colors.mutedForeground} />
                  ) : (
                    <Eye size={Math.max(18, Math.min(20 * scale, 22))} color={colors.mutedForeground} />
                  )}
                </Pressable>
              </View>
              {errors.password && (
                <Text style={[styles.errorText, responsiveStyles.errorText, { color: colors.destructive }]}>{errors.password}</Text>
              )}
            </View>

            {/* Forgot Password link */}
            <Pressable style={styles.forgotPassword} onPress={onForgotPasswordClick}>
              <Text style={[styles.forgotPasswordText, responsiveStyles.forgotPasswordText, { color: colors.primary }]}>{t('auth.forgotPassword')}</Text>
            </Pressable>

            {/* Sign In button */}
            <Pressable
              style={[
                styles.loginButton,
                { paddingVertical: responsiveStyles.buttonPadding },
                isLoading && styles.loginButtonDisabled
              ]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={[styles.loginButtonText, responsiveStyles.buttonText]}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Text>
            </Pressable>

            {/* Divider: or continue with */}
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, responsiveStyles.dividerText, { color: colors.mutedForeground }]}>or continue with</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Google button */}
            <Pressable
              style={[
                styles.googleButton,
                { paddingVertical: responsiveStyles.inputPadding, backgroundColor: colors.inputBackground, borderColor: colors.border }
              ]}
              onPress={handleGoogleLogin}
            >
              <View style={styles.googleIconCircle}>
                <Text style={styles.googleIconText}>G</Text>
              </View>
              <Text style={[styles.googleButtonText, responsiveStyles.googleButtonText, { color: colors.foreground }]}>Continue with Google</Text>
            </Pressable>

            {/* Sign Up Link */}
            <View style={styles.signupContainer}>
              <Text style={[styles.signupText, responsiveStyles.signupText]}>{t('auth.noAccount')} </Text>
              <Pressable onPress={onSignupClick}>
                <Text style={[styles.signupLink, responsiveStyles.signupText]}>{t('auth.signUp')}</Text>
              </Pressable>
            </View>
          </View>

          {/* Footer tagline */}
          <Text style={[styles.footerText, responsiveStyles.footerText]}>
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
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  appName: {
    ...textStyles.h3,
    color: '#fff',
    marginBottom: 4,
  },
  tagline: {
    ...textStyles.bodySmall,
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.5,
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
    color: '#333',
    marginBottom: 8,
  },
  input: {
    ...textStyles.body,
    flex: 1,
    paddingVertical: 14,
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
    ...textStyles.caption,
    marginTop: 4,
    color: '#FF5252',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    ...textStyles.bodySmall,
    color: '#03A9F4',
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#03A9F4',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#03A9F4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    ...textStyles.body,
    color: '#fff',
    fontWeight: 'bold',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  signupText: {
    ...textStyles.bodySmall,
    color: '#666',
  },
  signupLink: {
    ...textStyles.bodySmall,
    color: '#03A9F4',
    fontWeight: 'bold',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    ...textStyles.caption,
    marginHorizontal: 12,
    color: '#9CA3AF',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
  },
  googleIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EA4335',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  googleIconText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  googleButtonText: {
    ...textStyles.bodySmall,
    color: '#111827',
    fontWeight: '500',
  },
  footerText: {
    marginTop: 32,
    textAlign: 'center',
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },
});

