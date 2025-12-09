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
import { Mail, Lock, User, Eye, EyeOff, Check, Gift } from 'lucide-react-native';
import { GoogleSignin, statusCodes } from '../utils/googleSignin';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { textStyles, createResponsiveTextStyles } from '../constants/fonts';
import { showToast } from '../utils/toast';

interface SignupScreenProps {
  onSignupSuccess?: (isNewUser?: boolean) => void;
  onLoginClick?: () => void;
  initialReferralCode?: string;
}

export default function SignupScreen({
  onSignupSuccess,
  onLoginClick,
  initialReferralCode,
}: SignupScreenProps = {}) {
  const { t } = useTranslation('common');
  const { width, height } = useWindowDimensions();
  const { isDark, colors } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState(initialReferralCode || '');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
  }>({});

  // Responsive scaling
  const scale = Math.min(width / 375, height / 812);
  const isSmallScreen = width < 375;
  const isLargeScreen = width > 430;

  const validateForm = () => {
    const newErrors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
      terms?: string;
    } = {};

    if (!name) {
      newErrors.name = t('auth.nameRequired');
    } else if (name.length < 2) {
      newErrors.name = t('auth.nameMin');
    }

    if (!email) {
      newErrors.email = t('auth.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t('auth.emailInvalid');
    }

    if (!password) {
      newErrors.password = t('auth.passwordRequired');
    } else if (password.length < 6) {
      newErrors.password = t('auth.passwordMin');
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(password)) {
      newErrors.password = t('auth.passwordComplexity');
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = t('auth.confirmPasswordRequired');
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = t('auth.passwordsNotMatch');
    }

    if (!acceptedTerms) {
      newErrors.terms = t('auth.termsRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const passwordStrength = () => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/(?=.*[a-z])(?=.*[A-Z])/.test(password)) strength++;
    if (/(?=.*[0-9])/.test(password)) strength++;
    if (/(?=.*[!@#$%^&*])/.test(password)) strength++;
    return strength;
  };

  const getStrengthColor = () => {
    const strength = passwordStrength();
    if (strength <= 1) return '#FF5252';
    if (strength <= 3) return '#FFC107';
    return '#4CAF50';
  };

  const getStrengthText = () => {
    const strength = passwordStrength();
    if (strength <= 1) return t('auth.passwordWeak') || 'Weak';
    if (strength <= 3) return t('auth.passwordMedium') || 'Medium';
    return t('auth.passwordStrong') || 'Strong';
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      const deviceName = `${Platform.OS} ${Platform.Version} - React Native`;
      const response = await authService.register({
        name,
        email,
        password,
        password_confirmation: confirmPassword,
        default_currency: 'USD', // Default, can be made selectable later
        device_name: deviceName,
        referral_code: referralCode || undefined,
      });

      if (Platform.OS === 'web') {
        if (onSignupSuccess) onSignupSuccess(true); // Regular signup always creates new user
        return;
      }
      
      showToast.success('Account created successfully', 'Success');
      if (onSignupSuccess) {
        setTimeout(() => {
          onSignupSuccess(true); // Regular signup always creates new user
        }, 500);
      }
    } catch (error: any) {
      console.error('Signup failed', error);
      
      // Handle Laravel validation errors
      const errorData = error?.response?.data;
      const validationErrors = errorData?.errors || {};
      
      // Set field-specific errors
      const newErrors: {
        name?: string;
        email?: string;
        password?: string;
        confirmPassword?: string;
        terms?: string;
      } = {};
      
      if (validationErrors.email && Array.isArray(validationErrors.email) && validationErrors.email.length > 0) {
        newErrors.email = validationErrors.email[0];
      }
      if (validationErrors.password && Array.isArray(validationErrors.password) && validationErrors.password.length > 0) {
        newErrors.password = validationErrors.password[0];
      }
      if (validationErrors.name && Array.isArray(validationErrors.name) && validationErrors.name.length > 0) {
        newErrors.name = validationErrors.name[0];
      }
      
      // Set errors in state to display them in the form
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
      }
      
      // Get the error message to display in alert
      let errorMessage = t('auth.signupFailed') || 'Signup failed. Please try again.';
      
      // Prioritize field-specific errors
      if (newErrors.email) {
        errorMessage = newErrors.email;
      } else if (newErrors.password) {
        errorMessage = newErrors.password;
      } else if (newErrors.name) {
        errorMessage = newErrors.name;
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      }
      
      showToast.error(errorMessage, t('auth.signupFailedTitle') || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (Platform.OS === 'web') {
      if (onSignupSuccess) onSignupSuccess();
      return;
    }

    try {
      setIsLoading(true);
      
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();
      
      // Send token to backend
      const deviceName = `${Platform.OS} ${Platform.Version} - React Native`;
      const response = await authService.googleLogin({
        token: tokens.idToken,
        device_name: deviceName
      });

      console.log('[SignupScreen] Social login response:', 'is_new_user:', response.is_new_user, 'isNewUser:', response.isNewUser);

      // Check if this is a new user - if so, show onboarding, otherwise go to dashboard
      // When user signs up via signup page, if account already exists, backend returns is_new_user: false
      // API client transforms snake_case to camelCase, so check both
      const isNewUser = response.isNewUser !== false && response.is_new_user !== false; // Default to true if undefined, only false if explicitly false
      
      console.log('[SignupScreen] Determined isNewUser:', isNewUser);
      
      if (onSignupSuccess) {
        onSignupSuccess(isNewUser);
      }
    } catch (error: any) {
      console.error('Google Sign-Up error:', error);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled
      } else if (error.code === statusCodes.IN_PROGRESS) {
        showToast.error(t('auth.signInProgress') || 'Sign in already in progress', t('settings.error') || 'Error');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        showToast.error(t('auth.playServicesNotAvailable') || 'Google Play Services not available', t('settings.error') || 'Error');
      } else {
        showToast.error(error.message || t('auth.googleSignUpError') || 'An error occurred during Google Sign-Up', t('auth.googleSignUpFailed') || 'Google Sign-Up Failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Responsive styles
  const responsiveTextStyles = createResponsiveTextStyles(width);

  // Dynamic gradient colors based on theme
  const gradientColors = (isDark 
    ? ['#1a1a1a', '#2a2a2a'] 
    : ['#03A9F4', '#0288D1']) as [string, string, ...string[]];

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
              <Text style={[styles.headerTitle, responsiveTextStyles.h3, { color: isDark ? colors.foreground : '#fff' }]}>{t('auth.createAccount')}</Text>
              <Text style={[styles.headerSubtitle, responsiveTextStyles.body, { color: isDark ? colors.mutedForeground : 'rgba(255, 255, 255, 0.9)' }]}>{t('auth.signupSubtitle')}</Text>
            </View>

            {/* Signup Form */}
            <View
              style={[
                styles.formContainer,
                {
                  maxWidth: isLargeScreen ? 430 : '100%',
                  backgroundColor: colors.card,
                },
              ]}
            >
              {/* Name Field */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, responsiveTextStyles.label, { color: colors.foreground }]}>{t('auth.fullName')}</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                  <User
                    size={Math.max(18, Math.min(20 * scale, 22))}
                    color={colors.mutedForeground}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      responsiveTextStyles.body,
                      { paddingVertical: 14, color: colors.foreground },
                      errors.name && styles.inputError,
                    ]}
                    placeholder={t('auth.namePlaceholder')}
                    placeholderTextColor={colors.mutedForeground}
                    value={name}
                    onChangeText={(text) => {
                      setName(text);
                      if (errors.name) setErrors({ ...errors, name: undefined });
                    }}
                    autoCapitalize="words"
                  />
                </View>
                {errors.name && <Text style={[styles.errorText, responsiveTextStyles.caption, { color: colors.destructive }]}>{errors.name}</Text>}
              </View>

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
                      if (errors.email) setErrors({ ...errors, email: undefined });
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>
                {errors.email && <Text style={[styles.errorText, responsiveTextStyles.caption, { color: colors.destructive }]}>{errors.email}</Text>}
              </View>

              {/* Password Field */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, responsiveTextStyles.label, { color: colors.foreground }]}>{t('auth.password')}</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                  <Lock
                    size={Math.max(18, Math.min(20 * scale, 22))}
                    color={colors.mutedForeground}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      responsiveTextStyles.body,
                      { paddingVertical: 14, color: colors.foreground },
                      errors.password && styles.inputError,
                    ]}
                    placeholder={t('auth.passwordPlaceholderSignup')}
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
                      <EyeOff
                        size={Math.max(18, Math.min(20 * scale, 22))}
                        color={colors.mutedForeground}
                      />
                    ) : (
                      <Eye
                        size={Math.max(18, Math.min(20 * scale, 22))}
                        color={colors.mutedForeground}
                      />
                    )}
                  </Pressable>
                </View>
                {password && (
                  <View style={styles.passwordStrengthContainer}>
                    <View style={[styles.passwordStrengthBar, { backgroundColor: colors.border }]}>
                      <View
                        style={[
                          styles.passwordStrengthFill,
                          {
                            width: `${(passwordStrength() / 5) * 100}%`,
                            backgroundColor: getStrengthColor(),
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.passwordStrengthText, responsiveTextStyles.caption, { color: getStrengthColor() }]}>
                      {getStrengthText()}
                    </Text>
                  </View>
                )}
                {errors.password && <Text style={[styles.errorText, responsiveTextStyles.caption, { color: colors.destructive }]}>{errors.password}</Text>}
              </View>

              {/* Confirm Password Field */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, responsiveTextStyles.label, { color: colors.foreground }]}>{t('auth.confirmPassword')}</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                  <Lock
                    size={Math.max(18, Math.min(20 * scale, 22))}
                    color={colors.mutedForeground}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      responsiveTextStyles.body,
                      { paddingVertical: 14, color: colors.foreground },
                      errors.confirmPassword && styles.inputError,
                    ]}
                    placeholder={t('auth.confirmPasswordPlaceholder')}
                    placeholderTextColor={colors.mutedForeground}
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
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
                        color={colors.mutedForeground}
                      />
                    ) : (
                      <Eye
                        size={Math.max(18, Math.min(20 * scale, 22))}
                        color={colors.mutedForeground}
                      />
                    )}
                  </Pressable>
                </View>
                {errors.confirmPassword && (
                  <Text style={[styles.errorText, responsiveTextStyles.caption, { color: colors.destructive }]}>{errors.confirmPassword}</Text>
                )}
              </View>

              {/* Referral Code Field */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, responsiveTextStyles.label, { color: colors.foreground }]}>
                  {t('auth.referralCode')} <Text style={[styles.optionalText, responsiveTextStyles.small, { color: colors.mutedForeground }]}> ({t('common.optional') || 'Optional'})</Text>
                </Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                  <Gift
                    size={Math.max(18, Math.min(20 * scale, 22))}
                    color={colors.mutedForeground}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      responsiveTextStyles.body,
                      { paddingVertical: 14, color: colors.foreground },
                    ]}
                    placeholder={t('auth.referralCodePlaceholder')}
                    placeholderTextColor={colors.mutedForeground}
                    value={referralCode}
                    onChangeText={(text) => setReferralCode(text.toUpperCase())}
                    autoCapitalize="characters"
                    maxLength={20}
                  />
                </View>
                {referralCode && (
                  <Text style={[styles.referralHint, responsiveTextStyles.caption, { color: colors.mutedForeground }]}>
                    {t('auth.referralCodeHint')}
                  </Text>
                )}
              </View>

              {/* Terms and Conditions */}
              <View style={styles.termsContainer}>
                <Pressable
                  onPress={() => {
                    setAcceptedTerms(!acceptedTerms);
                    if (errors.terms) setErrors({ ...errors, terms: undefined });
                  }}
                  style={[
                    styles.checkbox,
                    { borderColor: colors.border },
                    acceptedTerms && [styles.checkboxChecked, { backgroundColor: colors.primary, borderColor: colors.primary }],
                  ]}
                >
                  {acceptedTerms && <Check size={14} color="#fff" />}
                </Pressable>
                <Text style={[styles.termsText, responsiveTextStyles.caption, { color: colors.mutedForeground }]}>
                  I agree to the{' '}
                  <Text style={[styles.termsLink, { color: colors.primary }]}>{t('auth.termsOfService')}</Text>
                  {' and '}
                  <Text style={[styles.termsLink, { color: colors.primary }]}>{t('auth.privacyPolicy')}</Text>
                </Text>
              </View>
              {errors.terms && <Text style={[styles.errorText, responsiveTextStyles.caption, { color: colors.destructive }]}>{errors.terms}</Text>}

              {/* Signup Button */}
              <Pressable
                style={[
                  styles.signupButton,
                  { paddingVertical: 14 },
                  isLoading && styles.signupButtonDisabled,
                ]}
                onPress={handleSignup}
                disabled={isLoading}
              >
                <Text style={[styles.signupButtonText, responsiveTextStyles.button]}>
                  {isLoading ? t('auth.creatingAccount') : t('auth.createAccountButton')}
                </Text>
              </Pressable>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, responsiveTextStyles.caption, { color: colors.mutedForeground }]}>{t('auth.continueWith')}</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              </View>

              {/* Google Button */}
              <Pressable
                style={[
                  styles.googleButton,
                  { paddingVertical: 14, backgroundColor: colors.inputBackground, borderColor: colors.border },
                ]}
                onPress={handleGoogleSignup}
              >
                <View style={styles.googleIconCircle}>
                  <Text style={styles.googleIconText}>G</Text>
                </View>
                <Text style={[styles.googleButtonText, responsiveTextStyles.button, { color: colors.foreground }]}>{t('auth.continueWithGoogle')}</Text>
              </Pressable>

              {/* Login Link */}
              <View style={styles.loginLinkContainer}>
                <Text style={[styles.loginLinkText, responsiveTextStyles.body, { color: colors.mutedForeground }]}>{t('auth.alreadyHaveAccount')} </Text>
                <Pressable onPress={onLoginClick}>
                  <Text style={[styles.loginLink, responsiveTextStyles.body, { color: colors.primary }]}>{t('auth.signIn')}</Text>
                </Pressable>
              </View>
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
    ...textStyles.h2,
    fontWeight: 'bold',
    marginTop: 16,
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
  optionalText: {
    ...textStyles.small,
    fontWeight: '400',
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
  eyeIcon: {
    position: 'absolute',
    right: 14,
  },
  inputError: {
    borderColor: '#FF5252',
  },
  errorText: {
    marginTop: 4,
    ...textStyles.caption,
  },
  passwordStrengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  passwordStrengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  passwordStrengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  passwordStrengthText: {
    ...textStyles.caption,
    fontWeight: '600',
  },
  referralHint: {
    ...textStyles.caption,
    marginTop: 4,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
  },
  termsText: {
    flex: 1,
    ...textStyles.caption,
    lineHeight: 20,
  },
  termsLink: {
    fontWeight: '600',
  },
  signupButton: {
    backgroundColor: '#03A9F4',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#03A9F4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  signupButtonDisabled: {
    opacity: 0.6,
  },
  signupButtonText: {
    color: '#fff',
    ...textStyles.button,
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
  },
  dividerText: {
    marginHorizontal: 12,
    ...textStyles.caption,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 16,
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
    ...textStyles.button,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  googleButtonText: {
    ...textStyles.button,
    fontWeight: '500',
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginLinkText: {
    ...textStyles.body,
  },
  loginLink: {
    ...textStyles.body,
    fontWeight: 'bold',
  },
  footerText: {
    marginTop: 24,
    textAlign: 'center',
  },
});

