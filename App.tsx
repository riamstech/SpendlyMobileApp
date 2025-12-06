import "./src/i18n";
import React, { useState, useCallback, ErrorInfo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
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

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{this.state.error?.message || 'Unknown error'}</Text>
          <Text style={styles.errorHint}>Please restart the app</Text>
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
  
  // Notification listeners refs
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);
  const notificationsInitialized = useRef(false);

  // Initialize notifications when user reaches dashboard
  useEffect(() => {
    if (currentScreen === 'dashboard' && !notificationsInitialized.current) {
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
      console.log('🔥 Initializing Firebase push notifications...');
      
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

      // Request permissions
      const { granted } = await notificationService.requestPermissions();
      
      if (!granted) {
        console.log('⚠️ Notification permissions not granted');
        return;
      }

      console.log('✅ Notification permissions granted');

      // Get FCM token (Firebase)
      const fcmToken = await notificationService.getFCMToken();
      
      if (!fcmToken) {
        console.log('⚠️ Failed to get FCM token, trying Expo token...');
        // Fallback to Expo token if Firebase not configured yet
        const expoPushToken = await notificationService.getExpoPushToken();
        if (!expoPushToken) {
          console.log('⚠️ Failed to get push token');
          return;
        }
        console.log('✅ Using Expo push token');
      } else {
        console.log('✅ FCM token obtained:', fcmToken.substring(0, 20) + '...');
      }

      const pushToken = fcmToken || await notificationService.getExpoPushToken();
      if (!pushToken) return;

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

      // Set up Firebase listeners
      const unsubscribe = notificationService.setupFirebaseListeners(
        (message) => {
          console.log('🔔 Firebase message received (foreground):', message);
          // Increment badge count
          notificationService.incrementBadgeCount();
          // You can show an in-app alert here
        },
        (message) => {
          console.log('👆 Notification tapped:', message);
          // Clear badge when notification is opened
          notificationService.clearBadgeCount();
          // Handle navigation based on notification data
          const data = message.data;
          console.log('Notification data:', data);
          // Example: if (data?.screen === 'transactions') navigate to transactions
        }
      );

      // Set up Expo notification listeners (for local notifications)
      notificationListener.current = notificationService.addNotificationReceivedListener(
        (notification) => {
          console.log('🔔 Local notification received:', notification);
          notificationService.incrementBadgeCount();
        }
      );

      responseListener.current = notificationService.addNotificationResponseReceivedListener(
        (response) => {
          console.log('👆 Local notification tapped:', response);
          notificationService.clearBadgeCount();
          const data = response.notification.request.content.data;
          const actionIdentifier = response.actionIdentifier;
          
          console.log('Action:', actionIdentifier, 'Data:', data);
          
          // Handle different actions
          if (actionIdentifier === 'VIEW') {
            // Navigate to relevant screen
            console.log('User wants to view details');
          } else if (actionIdentifier === 'DISMISS') {
            // Just dismiss
            console.log('User dismissed notification');
          }
        }
      );

      // Subscribe to topics (optional)
      await notificationService.subscribeToTopic('all-users');
      await notificationService.subscribeToTopic('transactions');

      console.log('✅ Notification listeners and categories set up');
    } catch (error) {
      console.error('❌ Error initializing notifications:', error);
    }
  };

  React.useEffect(() => {
    console.log('AppContent mounted, currentScreen:', currentScreen);
  }, [currentScreen]);

  const handleSplashFinish = useCallback(() => {
    setCurrentScreen('login');
  }, []);

  const handleLoginSuccess = useCallback(() => {
    setCurrentScreen('dashboard');
  }, []);

  const handleSignupSuccess = useCallback(() => {
    setCurrentScreen('onboarding');
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
          <MainScreen onLogout={handleLogout} />
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
      </ThemeProvider>
    </ErrorBoundary>
  );
}


