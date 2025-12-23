import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Secure Storage Service
 * Uses expo-secure-store for sensitive data on iOS/Android
 * Falls back to AsyncStorage on web (with warning)
 */
class SecureStorageService {
  private isSecureAvailable: boolean;

  constructor() {
    this.isSecureAvailable = Platform.OS !== 'web';
  }

  /**
   * Store a value securely
   */
  async setItem(key: string, value: string): Promise<void> {
    if (this.isSecureAvailable) {
      await SecureStore.setItemAsync(key, value);
    } else {
      // Fallback for web - use AsyncStorage with warning
      console.warn('SecureStorage: Using AsyncStorage fallback on web. Data is not encrypted.');
      await AsyncStorage.setItem(`secure_${key}`, value);
    }
  }

  /**
   * Retrieve a value from secure storage
   */
  async getItem(key: string): Promise<string | null> {
    if (this.isSecureAvailable) {
      return SecureStore.getItemAsync(key);
    } else {
      return AsyncStorage.getItem(`secure_${key}`);
    }
  }

  /**
   * Remove a value from secure storage
   */
  async removeItem(key: string): Promise<void> {
    if (this.isSecureAvailable) {
      await SecureStore.deleteItemAsync(key);
    } else {
      await AsyncStorage.removeItem(`secure_${key}`);
    }
  }

  /**
   * Store authentication token securely
   */
  async setAuthToken(token: string): Promise<void> {
    await this.setItem('auth_token', token);
  }

  /**
   * Get authentication token
   */
  async getAuthToken(): Promise<string | null> {
    return this.getItem('auth_token');
  }

  /**
   * Clear authentication token
   */
  async clearAuthToken(): Promise<void> {
    await this.removeItem('auth_token');
  }

  /**
   * Store biometric preference
   */
  async setBiometricEnabled(enabled: boolean): Promise<void> {
    await this.setItem('biometric_enabled', enabled ? 'true' : 'false');
  }

  /**
   * Get biometric preference
   */
  async getBiometricEnabled(): Promise<boolean> {
    const value = await this.getItem('biometric_enabled');
    return value === 'true';
  }

  /**
   * Store app lock timeout (in minutes)
   */
  async setAppLockTimeout(minutes: number): Promise<void> {
    await this.setItem('app_lock_timeout', String(minutes));
  }

  /**
   * Get app lock timeout (default: 5 minutes)
   */
  async getAppLockTimeout(): Promise<number> {
    const value = await this.getItem('app_lock_timeout');
    return value ? parseInt(value, 10) : 5;
  }

  /**
   * Store last active timestamp
   */
  async setLastActiveTime(): Promise<void> {
    await this.setItem('last_active_time', String(Date.now()));
  }

  /**
   * Get last active timestamp
   */
  async getLastActiveTime(): Promise<number> {
    const value = await this.getItem('last_active_time');
    return value ? parseInt(value, 10) : Date.now();
  }

  /**
   * Check if app should be locked based on timeout
   */
  async shouldLockApp(): Promise<boolean> {
    const timeout = await this.getAppLockTimeout();
    const lastActive = await this.getLastActiveTime();
    const now = Date.now();
    const elapsed = (now - lastActive) / 1000 / 60; // minutes
    return elapsed > timeout;
  }
}

export const secureStorage = new SecureStorageService();
