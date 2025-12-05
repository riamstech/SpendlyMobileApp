import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usersService } from '../api/services/users';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
  border: string;
  input: string;
  inputBackground: string;
}

const lightColors: ThemeColors = {
  background: '#ffffff',
  foreground: '#212121',
  card: '#ffffff',
  cardForeground: '#212121',
  primary: '#03A9F4',
  primaryForeground: '#ffffff',
  secondary: '#FFC107',
  secondaryForeground: '#212121',
  muted: '#ececf0',
  mutedForeground: '#717182',
  accent: '#e9ebef',
  accentForeground: '#212121',
  destructive: '#FF5252',
  destructiveForeground: '#ffffff',
  success: '#4CAF50',
  successForeground: '#ffffff',
  warning: '#FFC107',
  warningForeground: '#212121',
  border: 'rgba(0, 0, 0, 0.1)',
  input: '#f3f3f5',
  inputBackground: '#f3f3f5',
};

const darkColors: ThemeColors = {
  background: '#1a1a1a',
  foreground: '#ffffff',
  card: '#212121',
  cardForeground: '#ffffff',
  primary: '#03A9F4',
  primaryForeground: '#ffffff',
  secondary: '#FFC107',
  secondaryForeground: '#ffffff',
  muted: '#2a2a2a',
  mutedForeground: '#a0a0a0',
  accent: '#2a2a2a',
  accentForeground: '#ffffff',
  destructive: '#FF5252',
  destructiveForeground: '#ffffff',
  success: '#4CAF50',
  successForeground: '#ffffff',
  warning: '#FFC107',
  warningForeground: '#212121',
  border: 'rgba(255, 255, 255, 0.1)',
  input: '#2a2a2a',
  inputBackground: '#2a2a2a',
};

interface ThemeContextType {
  isDark: boolean;
  themeMode: ThemeMode;
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@spendly_theme_mode';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  // Determine if dark mode should be active
  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');

  // Get current theme colors
  const colors = isDark ? darkColors : lightColors;

  // Load theme preference from storage
  useEffect(() => {
    const loadTheme = async () => {
      try {
        // First, try to load from local storage (fastest)
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (stored && (stored === 'light' || stored === 'dark' || stored === 'system')) {
          setThemeModeState(stored as ThemeMode);
          
          // Then try to sync with backend in the background (non-blocking)
          try {
            const settings = await usersService.getUserSettings();
            if (settings.settings?.darkMode !== undefined) {
              const backendMode = settings.settings.darkMode ? 'dark' : 'light';
              if (backendMode !== stored && stored !== 'system') {
                // Backend has different preference, update local storage
                await AsyncStorage.setItem(THEME_STORAGE_KEY, backendMode);
                setThemeModeState(backendMode);
              }
            }
          } catch (error) {
            // Silently fail - we already have a theme from local storage
            // This is expected if user is not logged in
          }
        } else {
          // No local storage, try to load from user settings (non-blocking)
          try {
            const settings = await usersService.getUserSettings();
            if (settings.settings?.darkMode !== undefined) {
              const mode = settings.settings.darkMode ? 'dark' : 'light';
              setThemeModeState(mode);
              await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
            }
          } catch (error) {
            // If API fails (e.g., user not logged in), use system theme as fallback
            // This is expected and not an error
          }
        }
      } catch (error) {
        // Fallback to system theme - app will still render
        console.warn('Failed to load theme preference:', error);
        setThemeModeState('system');
      }
    };

    loadTheme();
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      
      // Update user settings on backend
      try {
        await usersService.updateUserSettings({
          dark_mode: mode === 'dark' || (mode === 'system' && systemColorScheme === 'dark'),
        });
      } catch (error) {
        console.error('Failed to update theme in user settings:', error);
      }
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const toggleTheme = async () => {
    const newMode = isDark ? 'light' : 'dark';
    await setThemeMode(newMode);
  };

  // Always render children - theme will use system default until loaded
  return (
    <ThemeContext.Provider
      value={{
        isDark,
        themeMode,
        colors,
        setThemeMode,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

