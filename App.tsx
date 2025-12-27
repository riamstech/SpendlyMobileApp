import "./src/i18n";
import React, { useState, useCallback, ErrorInfo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import * as LocalAuthentication from 'expo-local-authentication';
import Toast from 'react-native-toast-message';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import MainScreen from './src/screens/MainScreen';
import { notificationService } from './src/services/notificationService';
import { devicesService } from './src/api/services/devices';
import { hapticService } from './src/services/hapticService';
import i18n from './src/i18n';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>
            {i18n.t('errorBoundary.somethingWentWrong', { defaultValue: 'Something went wrong' })}
          </Text>
          <Text style={styles.errorText}>
            {this.state.error?.message || i18n.t('errorBoundary.unknownError', { defaultValue: 'Unknown error' })}
          </Text>
          <Pressable 
            style={styles.retryButton}
            onPress={this.handleRetry}
          >
            <Text style={styles.retryButtonText}>
              {i18n.t('errorBoundary.tryAgain', { defaultValue: 'Try Again' })}
            </Text>
          </Pressable>
          <Text style={styles.errorHint}>
            {i18n.t('errorBoundary.ifPersists', { defaultValue: 'If the problem persists, please restart the app' })}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

type Screen = 'splash' | 'login' | 'signup' | 'forgot-password' | 'reset-password' | 'onboarding' | 'dashboard';

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [resetPasswordParams, setResetPasswordParams] = useState<{ token?: string; email?: string }>({});
  const [initialScreen, setInitialScreen] = useState<'inbox' | 'home' | undefined>(undefined);
  
  // Notification listeners refs
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);
  const notificationsInitialized = useRef(false);

  // Initialize notifications when user reaches dashboard or after login/signup
  useEffect(() => {
    // Request permissions as soon as user is authenticated (dashboard screen)
    if (currentScreen === 'dashboard' && !notificationsInitialized.current) {
      console.log('🚀 Dashboard loaded, initializing notifications...');
      initializeNotifications();
      notificationsInitialized.current = true;
    }

    // Cleanup on unmount
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [currentScreen]);

  const initializeNotifications = async () => {
    try {
      console.log('🔔 Initializing Expo push notifications...');
      
      // Set up notification categories with actions
      await notificationService.setNotificationCategories([
        {
          identifier: 'TRANSACTION',
          actions: [
            {
              identifier: 'VIEW',
              title: 'View',
              options: { foreground: true },
            },
            {
              identifier: 'DISMISS',
              title: 'Dismiss',
              options: { foreground: false },
            },
          ],
        },
      ]);

      // Request permissions - this will show the system permission dialog on Android 13+
      console.log('📱 Requesting notification permissions...');
      const permissionResult = await notificationService.requestPermissions();
      
      if (!permissionResult.granted) {
        console.log('⚠️ Notification permissions not granted');
        console.log('📊 Permission status:', permissionResult.status);
        console.log('🔄 Can ask again:', permissionResult.canAskAgain);
        
        if (permissionResult.status === 'denied') {
          console.log('❌ User denied notification permissions');
          console.log('💡 User can enable in Settings → Apps → Spendly Money → Notifications');
        }
        return;
      }

      console.log('✅ Notification permissions granted!');

      // Get Expo push token (works with Firebase via Expo's push service)
      const pushToken = await notificationService.getExpoPushToken();
      
      if (!pushToken) {
        console.log('⚠️ Failed to get push token');
        return;
      }

      console.log('✅ Push token obtained:', pushToken.substring(0, 20) + '...');

      // Get device UUID
      const deviceUUID = await notificationService.getDeviceUUID();
      console.log('📱 Device UUID:', deviceUUID);

      // Register device with backend
      try {
        await devicesService.registerDevice(deviceUUID, pushToken);
        console.log('✅ Device registered for push notifications');
      } catch (error) {
        console.error('❌ Failed to register device:', error);
      }

      // Set up notification listeners
      notificationListener.current = notificationService.addNotificationReceivedListener(
        (notification) => {
          console.log('🔔 Notification received (foreground):', notification);
          notificationService.incrementBadgeCount();
        }
      );

      responseListener.current = notificationService.addNotificationResponseReceivedListener(
        (response) => {
          console.log('👆 Notification tapped:', response);
          notificationService.clearBadgeCount();
          const data = response.notification.request.content.data;
          const actionIdentifier = response.actionIdentifier;
          
          console.log('Action:', actionIdentifier, 'Data:', data);
          
          // Navigate based on notification data
          if (actionIdentifier === 'VIEW' || actionIdentifier === 'DEFAULT') {
            // Check if we should navigate to inbox
            if (data?.screen === 'inbox') {
              setCurrentScreen('dashboard');
              setInitialScreen('inbox');
              console.log('✅ Navigating to inbox');
            } else if (data?.screen === 'dashboard' || !data?.screen) {
              setCurrentScreen('dashboard');
              setInitialScreen('home');
              console.log('✅ Navigated to dashboard');
            }
            // You can add more screen navigation here
          } else if (actionIdentifier === 'DISMISS') {
            console.log('User dismissed notification');
          }
        }
      );

      console.log('✅ Notification listeners and categories set up');
    } catch (error) {
      console.error('❌ Error initializing notifications:', error);
    }
  };

  React.useEffect(() => {
    console.log('AppContent mounted, currentScreen:', currentScreen);
  }, [currentScreen]);

  const handleLoginSuccess = useCallback(async (isNewUser?: boolean) => {
    console.log('[handleLoginSuccess] isNewUser:', isNewUser);
    
    // If isNewUser flag is provided, use it directly
    if (isNewUser !== undefined) {
      if (isNewUser) {
        console.log('[handleLoginSuccess] New user detected, routing to onboarding');
        setCurrentScreen('onboarding');
      } else {
        console.log('[handleLoginSuccess] Existing user, routing to dashboard');
        setCurrentScreen('dashboard');
      }
      return;
    }

    // Fallback: Check if user needs onboarding (missing country indicates incomplete onboarding)
    try {
      const { authService } = await import('./src/api/services/auth');
      const user = await authService.getCurrentUser();
      console.log('[handleLoginSuccess] User profile:', { country: user.country, defaultCurrency: user.defaultCurrency });
      
      // Apply user's preferred language if available (check both fields)
      const userLang = user.preferredLocale || (user as any).language || (user as any).preferred_locale;
      if (userLang && userLang !== i18n.language) {
        console.log('[handleLoginSuccess] Applying user preferred language:', userLang);
        await i18n.changeLanguage(userLang);
      } else {
        // Fallback to AsyncStorage saved language
        const { loadSavedLanguage } = await import('./src/i18n');
        await loadSavedLanguage();
      }
      
      // If user doesn't have country set, they need onboarding
      // (defaultCurrency is set by backend for social login, but country is set during onboarding)
      const needsOnboarding = !user.country;
      
      if (needsOnboarding) {
        console.log('[handleLoginSuccess] User needs onboarding (no country), routing to onboarding');
        setCurrentScreen('onboarding');
      } else {
        console.log('[handleLoginSuccess] User has completed onboarding, routing to dashboard');
        setCurrentScreen('dashboard');
      }
    } catch (error) {
      console.error('[handleLoginSuccess] Error checking user onboarding status:', error);
      // Default to dashboard on error
      setCurrentScreen('dashboard');
    }
  }, []);

  const handleSplashFinish = useCallback(async () => {
    // Load saved language preference from AsyncStorage before proceeding
    try {
      const { loadSavedLanguage } = await import('./src/i18n');
      await loadSavedLanguage();
    } catch (error) {
      // Ignore error, continue with default language
    }

    // Check if user is already logged in
    try {
      const { apiClient } = await import('./src/api/client');
      const token = await apiClient.getTokenAsync();
      
      if (token) {
        // User has token, set it in cache for API calls
        apiClient.setToken(token);
        
        // Check biometric settings from LOCAL storage (works offline)
        const { secureStorage } = await import('./src/services/secureStorage');
        const biometricEnabled = await secureStorage.getBiometricEnabled();
        
        console.log('Biometric enabled (local):', biometricEnabled);
        
        if (biometricEnabled) {
          // Biometric is enabled, check hardware support
          const hasHardware = await LocalAuthentication.hasHardwareAsync();
          const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
          
          console.log('Biometric hardware:', hasHardware, 'types:', supportedTypes);
          
          if (hasHardware && supportedTypes.length > 0) {
            // Prompt for biometric authentication
            const result = await LocalAuthentication.authenticateAsync({
              promptMessage: 'Authenticate to access Spendly',
              disableDeviceFallback: false,
              cancelLabel: 'Cancel',
            });
            
            console.log('Biometric result:', result);
            
            if (result.success) {
              // Biometric successful, proceed to dashboard
              await hapticService.success();
              await handleLoginSuccess(false);
              return;
            } else {
              // Biometric failed, show retry option
              await hapticService.error();
              const retryResult = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Authentication failed. Try again',
                disableDeviceFallback: false,
                cancelLabel: 'Use Password',
              });
              if (retryResult.success) {
                await hapticService.success();
                await handleLoginSuccess(false);
                return;
              }
              // Second attempt failed, go to login
              setCurrentScreen('login');
              return;
            }
          } else {
            // No biometric hardware, proceed to dashboard without biometric
            await handleLoginSuccess(false);
            return;
          }
        } else {
          // Biometric not enabled, proceed to dashboard
          await handleLoginSuccess(false);
          return;
        }
      }
    } catch (error) {
      console.error('Error during biometric check:', error);
      // On error, proceed to login
    }
    
    // No token or error, go to login
    setCurrentScreen('login');
  }, [handleLoginSuccess]);

  const handleSignupSuccess = useCallback(async (isNewUser?: boolean) => {
    // If isNewUser flag is provided, use it directly
    // Otherwise, check user profile for onboarding status
    if (isNewUser !== undefined) {
      if (isNewUser) {
        setCurrentScreen('onboarding');
      } else {
        setCurrentScreen('dashboard');
      }
      return;
    }

    // Fallback: Check if user needs onboarding (missing country indicates incomplete onboarding)
    try {
      const { authService } = await import('./src/api/services/auth');
      const user = await authService.getCurrentUser();
      
      // Apply user's preferred language if available (check both fields)
      const userLang = user.preferredLocale || (user as any).language || (user as any).preferred_locale;
      if (userLang && userLang !== i18n.language) {
        console.log('[handleSignupSuccess] Applying user preferred language:', userLang);
        await i18n.changeLanguage(userLang);
      } else {
        // Fallback to AsyncStorage saved language
        const { loadSavedLanguage } = await import('./src/i18n');
        await loadSavedLanguage();
      }
      
      // If user doesn't have country set, they need onboarding
      // (defaultCurrency is set by backend for social login, but country is set during onboarding)
      const needsOnboarding = !user.country;
      
      if (needsOnboarding) {
        setCurrentScreen('onboarding');
      } else {
        setCurrentScreen('dashboard');
      }
    } catch (error) {
      console.error('Error checking user onboarding status:', error);
      // Default to onboarding on error for signup
      setCurrentScreen('onboarding');
    }
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    setCurrentScreen('dashboard');
  }, []);

  const handleLoginClick = useCallback(() => {
    setCurrentScreen('login');
  }, []);

  const handleSignupClick = useCallback(() => {
    setCurrentScreen('signup');
  }, []);

  const handleForgotPasswordClick = useCallback(() => {
    setCurrentScreen('forgot-password');
  }, []);

  const handleLogout = useCallback(() => {
    setCurrentScreen('login');
  }, []);

  const { isDark } = useTheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        {currentScreen === 'splash' && (
          <SplashScreen onFinish={handleSplashFinish} />
        )}
        {currentScreen === 'login' && (
          <LoginScreen
            onLoginSuccess={handleLoginSuccess}
            onSignupClick={handleSignupClick}
            onForgotPasswordClick={handleForgotPasswordClick}
          />
        )}
        {currentScreen === 'signup' && (
          <SignupScreen
            onSignupSuccess={handleSignupSuccess}
            onLoginClick={handleLoginClick}
          />
        )}
        {currentScreen === 'onboarding' && (
          <OnboardingScreen
            isAuthenticated={true}
            onComplete={handleOnboardingComplete}
          />
        )}
        {currentScreen === 'forgot-password' && (
          <ForgotPasswordScreen
            onBackToLogin={handleLoginClick}
          />
        )}
        {currentScreen === 'reset-password' && (
          <ResetPasswordScreen
            token={resetPasswordParams.token}
            email={resetPasswordParams.email}
            onBackToLogin={handleLoginClick}
          />
        )}
        {currentScreen === 'dashboard' && (
          <MainScreen 
            onLogout={handleLogout} 
            initialScreen={initialScreen === 'home' ? undefined : initialScreen} 
          />
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF5252',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#03A9F4',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default function App() {
  React.useEffect(() => {
    console.log('App component mounted');
    
    // Set up global error handlers for React Native
    const originalErrorHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      console.error('Global error handler:', error, 'isFatal:', isFatal);
      if (originalErrorHandler) {
        originalErrorHandler(error, isFatal);
      }
    });
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppContent />
        <Toast />
      </ThemeProvider>
    </ErrorBoundary>
  );
}


