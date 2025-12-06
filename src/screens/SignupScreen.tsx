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
import { Mail, Lock, User, Eye, EyeOff, Check, Gift } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { textStyles, createResponsiveTextStyles } from '../constants/fonts';

interface SignupScreenProps {
  onSignupSuccess?: () => void;
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
      newErrors.name = 'Name is required';
    } else if (name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!acceptedTerms) {
      newErrors.terms = 'You must accept the terms and conditions';
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
    if (strength <= 1) return 'Weak';
    if (strength <= 3) return 'Medium';
    return 'Strong';
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
        if (onSignupSuccess) onSignupSuccess();
        return;
      }
      
      Alert.alert('Success', 'Account created successfully', [
        {
          text: 'OK',
          onPress: () => {
            if (onSignupSuccess) {
              onSignupSuccess();
            }
          },
        },
      ]);
    } catch (error: any) {
      console.error('Signup failed', error);
      const message =
        error?.response?.data?.message ||
        'Signup failed. Please try again.';
      Alert.alert('Signup failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    if (Platform.OS === 'web') {
      if (onSignupSuccess) onSignupSuccess();
      return;
    }

    Alert.alert(
      'Google Sign Up',
      'By continuing you agree to sign up with Google.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue', 
          onPress: () => {
            // Simulate successful signup
            setTimeout(() => {
              if (onSignupSuccess) onSignupSuccess();
            }, 500);
          }
        }
      ]
    );
  };

  // Responsive styles
  const responsiveTextStyles = createResponsiveTextStyles(width);

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
              <Text style={[styles.headerTitle, responsiveTextStyles.h3]}>Create Account</Text>
              <Text style={[styles.headerSubtitle, responsiveTextStyles.body]}>Start tracking your finances today</Text>
            </View>

            {/* Signup Form */}
            <View
              style={[
                styles.formContainer,
                {
                  maxWidth: isLargeScreen ? 430 : '100%',
                },
              ]}
            >
              {/* Name Field */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, responsiveTextStyles.label]}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <User
                    size={Math.max(18, Math.min(20 * scale, 22))}
                    color="#9CA3AF"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      responsiveTextStyles.body,
                      { paddingVertical: 14 },
                      errors.name && styles.inputError,
                    ]}
                    placeholder="John Doe"
                    placeholderTextColor="#9CA3AF"
                    value={name}
                    onChangeText={(text) => {
                      setName(text);
                      if (errors.name) setErrors({ ...errors, name: undefined });
                    }}
                    autoCapitalize="words"
                  />
                </View>
                {errors.name && <Text style={[styles.errorText, responsiveTextStyles.caption]}>{errors.name}</Text>}
              </View>

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
                      if (errors.email) setErrors({ ...errors, email: undefined });
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>
                {errors.email && <Text style={[styles.errorText, responsiveTextStyles.caption]}>{errors.email}</Text>}
              </View>

              {/* Password Field */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, responsiveTextStyles.label]}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Lock
                    size={Math.max(18, Math.min(20 * scale, 22))}
                    color="#9CA3AF"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      responsiveTextStyles.body,
                      { paddingVertical: 14 },
                      errors.password && styles.inputError,
                    ]}
                    placeholder="Create a strong password"
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
                {password && (
                  <View style={styles.passwordStrengthContainer}>
                    <View style={styles.passwordStrengthBar}>
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
                {errors.password && <Text style={[styles.errorText, responsiveTextStyles.caption]}>{errors.password}</Text>}
              </View>

              {/* Confirm Password Field */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, responsiveTextStyles.label]}>Confirm Password</Text>
                <View style={styles.inputWrapper}>
                  <Lock
                    size={Math.max(18, Math.min(20 * scale, 22))}
                    color="#9CA3AF"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      responsiveTextStyles.body,
                      { paddingVertical: 14 },
                      errors.confirmPassword && styles.inputError,
                    ]}
                    placeholder="Re-enter your password"
                    placeholderTextColor="#9CA3AF"
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
                {errors.confirmPassword && (
                  <Text style={[styles.errorText, responsiveTextStyles.caption]}>{errors.confirmPassword}</Text>
                )}
              </View>

              {/* Referral Code Field */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, responsiveTextStyles.label]}>
                  Referral Code <Text style={[styles.optionalText, responsiveTextStyles.small]}>(Optional)</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <Gift
                    size={Math.max(18, Math.min(20 * scale, 22))}
                    color="#9CA3AF"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      responsiveTextStyles.body,
                      { paddingVertical: 14 },
                    ]}
                    placeholder="Enter referral code"
                    placeholderTextColor="#9CA3AF"
                    value={referralCode}
                    onChangeText={(text) => setReferralCode(text.toUpperCase())}
                    autoCapitalize="characters"
                    maxLength={20}
                  />
                </View>
                {referralCode && (
                  <Text style={[styles.referralHint, responsiveTextStyles.caption]}>
                    You'll both get 1 month of Pro free!
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
                    acceptedTerms && styles.checkboxChecked,
                  ]}
                >
                  {acceptedTerms && <Check size={14} color="#fff" />}
                </Pressable>
                <Text style={[styles.termsText, responsiveTextStyles.caption]}>
                  I agree to the{' '}
                  <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </View>
              {errors.terms && <Text style={[styles.errorText, responsiveTextStyles.caption]}>{errors.terms}</Text>}

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
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Text>
              </Pressable>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={[styles.dividerText, responsiveTextStyles.caption]}>or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Button */}
              <Pressable
                style={[
                  styles.googleButton,
                  { paddingVertical: 14 },
                ]}
                onPress={handleGoogleSignup}
              >
                <View style={styles.googleIconCircle}>
                  <Text style={styles.googleIconText}>G</Text>
                </View>
                <Text style={[styles.googleButtonText, responsiveTextStyles.button]}>Continue with Google</Text>
              </Pressable>

              {/* Login Link */}
              <View style={styles.loginLinkContainer}>
                <Text style={[styles.loginLinkText, responsiveTextStyles.body]}>Already have an account? </Text>
                <Pressable onPress={onLoginClick}>
                  <Text style={[styles.loginLink, responsiveTextStyles.body]}>Sign In</Text>
                </Pressable>
              </View>
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
    ...textStyles.h2,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
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
  optionalText: {
    ...textStyles.small,
    color: '#999',
    fontWeight: '400',
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
    color: '#FF5252',
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
    backgroundColor: '#e0e0e0',
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
    color: '#666',
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
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#03A9F4',
    borderColor: '#03A9F4',
  },
  termsText: {
    flex: 1,
    ...textStyles.caption,
    color: '#666',
    lineHeight: 20,
  },
  termsLink: {
    color: '#03A9F4',
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
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 12,
    ...textStyles.caption,
    color: '#9CA3AF',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
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
    color: '#111827',
    fontWeight: '500',
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginLinkText: {
    color: '#666',
    ...textStyles.body,
  },
  loginLink: {
    color: '#03A9F4',
    ...textStyles.body,
    fontWeight: 'bold',
  },
  footerText: {
    marginTop: 24,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.9)',
  },
});

