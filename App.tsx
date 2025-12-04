import "./src/i18n";
import React, { useState, useCallback } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import MainScreen from './src/screens/MainScreen';

type Screen = 'splash' | 'login' | 'signup' | 'forgot-password' | 'reset-password' | 'dashboard';

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [resetPasswordParams, setResetPasswordParams] = useState<{ token?: string; email?: string }>({});

  const handleSplashFinish = useCallback(() => {
    setCurrentScreen('login');
  }, []);

  const handleLoginSuccess = useCallback(() => {
    setCurrentScreen('dashboard');
  }, []);

  const handleSignupSuccess = useCallback(() => {
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

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}


