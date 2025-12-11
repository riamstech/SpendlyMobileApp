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
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { textStyles, createResponsiveTextStyles } from '../constants/fonts';
import { GoogleSignin, statusCodes } from '../utils/googleSignin';
import { config } from '../config/env';
import { showToast } from '../utils/toast';
import { GoogleLogo } from '../components/GoogleLogo';

interface LoginScreenProps {
  onLoginSuccess?: (isNewUser?: boolean) => void;
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
      showToast.error(message, 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    console.log('handleGoogleLogin called, Platform:', Platform.OS);
    
    if (Platform.OS === 'web') {
      // Web implementation or redirect
      console.log('Web platform detected, skipping Google Sign-In');
      if (onLoginSuccess) onLoginSuccess();
      return;
    }

    try {
      console.log('Starting Google Sign-In flow...');
      setIsLoading(true);
      
      console.log('Checking Play Services...');
      await GoogleSignin.hasPlayServices();
      
      console.log('Initiating Google Sign-In...');
      const userInfo = await GoogleSignin.signIn();
      console.log('Google Sign-In successful, user:', userInfo.data?.user?.email);
      
      console.log('Getting tokens...');
      const tokens = await GoogleSignin.getTokens();
      console.log('Tokens received, idToken length:', tokens.idToken?.length);
      
      // Send token to backend
      const deviceName = `${Platform.OS} ${Platform.Version} - React Native`;
      console.log('Sending token to backend...');
      const response = await authService.googleLogin({
        token: tokens.idToken,
        device_name: deviceName
      });
      console.log('Backend authentication successful', 'is_new_user:', response.is_new_user, 'isNewUser:', response.isNewUser, 'full response:', JSON.stringify(response));

      // Check if this is a new user - if so, show onboarding, otherwise go to dashboard
      // When user logs in via login page but doesn't have account, backend creates account and returns is_new_user: true
      // API client transforms snake_case to camelCase, so check both
      const isNewUser = response.isNewUser === true || response.is_new_user === true;
      
      console.log('[LoginScreen] Determined isNewUser:', isNewUser);
      
      if (onLoginSuccess) {
        onLoginSuccess(isNewUser);
      }
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled the login flow');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Sign in already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        showToast.error('Google Play Services not available', 'Error');
      } else {
        showToast.error(error.message || 'An error occurred during Google Sign-In', 'Google Sign-In Failed');
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

  React.useEffect(() => {
    if (Platform.OS !== 'web') {
      // Get Google Sign-In configuration from environment variables
      const webClientId = config.googleWebClientId;
      const iosClientId = config.googleIosClientId;
      
      GoogleSignin.configure({
        // Web Client ID (Required for idToken generation) - From environment variables
        webClientId, 
        // iOS Client ID - From environment variables
        iosClientId,
        // Android Client ID is handled automatically by google-services.json
        offlineAccess: true,
        scopes: ['email', 'profile'],
      });
      
      console.log(`🔐 Google Sign-In configured for ${Platform.OS} with webClientId: ${webClientId.substring(0, 30)}...`);
    }
  }, []);

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
              { paddingHorizontal: isSmallScreen ? 16 : 24, paddingVertical: isSmallScreen ? 16 : 24 }
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
          {/* Logo + headings (match web as close as possible) */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/logo-dark.png')}
              style={{ width: 80 * scale, height: 80 * scale, marginBottom: 16 }}
              resizeMode="contain"
            />
            <Text style={[styles.appName, responsiveTextStyles.h2, { color: isDark ? colors.foreground : '#fff' }]}>{t('auth.welcomeBack')}</Text>
            <Text style={[styles.tagline, responsiveTextStyles.body, { color: isDark ? colors.mutedForeground : 'rgba(255, 255, 255, 0.9)' }]}>{t('auth.loginSubtitle')}</Text>
          </View>

          {/* Login Form */}
          <View style={[
            styles.formContainer,
            {
              maxWidth: isLargeScreen ? 430 : '100%',
              width: isSmallScreen ? '100%' : '100%',
              backgroundColor: colors.card,
            }
          ]}>
            {/* Email Address */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, responsiveTextStyles.label, { color: colors.foreground }]}>{t('auth.email')}</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                <Mail size={Math.max(18, Math.min(20 * scale, 22))} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[
                    styles.input,
                    responsiveTextStyles.body,
                    { paddingVertical: 14, color: colors.foreground },
                    errors.email && styles.inputError
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

            {/* Password */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, responsiveTextStyles.label, { color: colors.foreground }]}>{t('auth.password')}</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                <Lock size={Math.max(18, Math.min(20 * scale, 22))} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[
                    styles.input,
                    responsiveTextStyles.body,
                    { paddingVertical: 14, color: colors.foreground },
                    errors.password && styles.inputError
                  ]}
                  placeholder={t('auth.passwordPlaceholder')}
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
                <Text style={[styles.errorText, responsiveTextStyles.caption, { color: colors.destructive }]}>{errors.password}</Text>
              )}
            </View>

            {/* Forgot Password link */}
            <Pressable style={styles.forgotPassword} onPress={onForgotPasswordClick}>
              <Text style={[styles.forgotPasswordText, responsiveTextStyles.bodySmall, { color: colors.primary }]}>{t('auth.forgotPassword')}</Text>
            </Pressable>

            {/* Sign In button */}
            <Pressable
              style={[
                styles.loginButton,
                { paddingVertical: 14 },
                isLoading && styles.loginButtonDisabled
              ]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={[styles.loginButtonText, responsiveTextStyles.button]}>
                {isLoading ? t('auth.signingIn') : t('auth.signIn')}
              </Text>
            </Pressable>

            {/* Divider: or continue with */}
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, responsiveTextStyles.caption, { color: colors.mutedForeground }]}>{t('auth.continueWith')}</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Google button */}
            <Pressable
              style={[
                styles.googleButton,
                { paddingVertical: 14, backgroundColor: colors.inputBackground, borderColor: colors.border }
              ]}
              onPress={handleGoogleLogin}
            >
              <View style={styles.googleIconContainer}>
                <GoogleLogo size={24} />
              </View>
              <Text style={[styles.googleButtonText, responsiveTextStyles.button, { color: colors.foreground }]}>{t('auth.continueWithGoogle')}</Text>
            </Pressable>

            {/* Sign Up Link */}
            <View style={styles.signupContainer}>
              <Text style={[styles.signupText, responsiveTextStyles.bodySmall, { color: colors.mutedForeground }]}>{t('auth.noAccount')} </Text>
              <Pressable onPress={onSignupClick}>
                <Text style={[styles.signupLink, responsiveTextStyles.bodySmall, { color: colors.primary }]}>{t('auth.signUp')}</Text>
              </Pressable>
            </View>
          </View>

          {/* Footer tagline */}
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
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  appName: {
    ...textStyles.h2,
    marginBottom: 4,
  },
  tagline: {
    ...textStyles.body,
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
  },
  signupLink: {
    ...textStyles.bodySmall,
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
  googleIconContainer: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleButtonText: {
    ...textStyles.bodySmall,
    color: '#111827',
    fontWeight: '500',
  },
  footerText: {
    marginTop: 32,
    textAlign: 'center',
  },
});

