import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: string;
}

export interface NotificationCategory {
  identifier: string;
  actions: NotificationAction[];
}

export interface NotificationAction {
  identifier: string;
  title: string;
  options?: {
    foreground?: boolean;
    destructive?: boolean;
    authenticationRequired?: boolean;
  };
}

export const notificationService = {
  /**
   * Request notification permissions from the user
   */
  async requestPermissions(): Promise<NotificationPermissionStatus> {
    try {
      console.log('🔔 Checking notification permissions...');
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('📋 Current permission status:', existingStatus);
      
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        console.log('📱 Requesting notification permissions...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log('✅ Permission request result:', status);
      } else {
        console.log('✅ Notifications already granted');
      }
      
      const result = {
        granted: finalStatus === 'granted',
        canAskAgain: finalStatus !== 'denied',
        status: finalStatus,
      };
      
      console.log('📊 Permission result:', result);
      return result;
    } catch (error) {
      console.error('❌ Error requesting notification permissions:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'error',
      };
    }
  },

  /**
   * Get the Expo push token for this device
   * This works with Firebase Cloud Messaging via Expo's push service
   */
  async getExpoPushToken(): Promise<string | null> {
    try {
      // Check if running on a physical device
      if (!Device.isDevice) {
        console.warn('Push notifications only work on physical devices');
        return null;
      }

      // Request permissions first
      const { granted } = await this.requestPermissions();
      if (!granted) {
        console.warn('Notification permissions not granted');
        return null;
      }

      // Get the Expo push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      
      if (!projectId) {
        console.error('Project ID not found in app config');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      console.log('✅ Expo Push Token:', token.data);
      return token.data;
    } catch (error) {
      console.error('Error getting Expo push token:', error);
      return null;
    }
  },

  /**
   * Get device UUID for registration
   */
  async getDeviceUUID(): Promise<string> {
    try {
      const deviceId = Constants.sessionId || `${Platform.OS}-${Date.now()}`;
      return deviceId;
    } catch (error) {
      console.error('Error getting device UUID:', error);
      return `${Platform.OS}-${Date.now()}`;
    }
  },

  /**
   * Add notification received listener (when app is in foreground)
   */
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
  },

  /**
   * Add notification response listener (when user taps on notification)
   */
  addNotificationResponseReceivedListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  },

  /**
   * Set notification categories with actions
   */
  async setNotificationCategories(categories: NotificationCategory[]): Promise<void> {
    try {
      for (const category of categories) {
        await Notifications.setNotificationCategoryAsync(
          category.identifier,
          category.actions.map(action => ({
            identifier: action.identifier,
            buttonTitle: action.title,
            options: {
              opensAppToForeground: action.options?.foreground ?? true,
              isDestructive: action.options?.destructive ?? false,
              isAuthenticationRequired: action.options?.authenticationRequired ?? false,
            },
          }))
        );
      }
      console.log('✅ Notification categories set');
    } catch (error) {
      console.error('Error setting notification categories:', error);
    }
  },

  /**
   * Schedule a local notification (for testing)
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: Record<string, any>,
    seconds: number = 1,
    categoryIdentifier?: string
  ): Promise<string> {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          categoryIdentifier,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds,
        } as Notifications.TimeIntervalTriggerInput,
      });
      return id;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  },

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  },

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  },

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  },

  /**
   * Increment badge count
   */
  async incrementBadgeCount(): Promise<void> {
    try {
      const current = await this.getBadgeCount();
      await this.setBadgeCount(current + 1);
    } catch (error) {
      console.error('Error incrementing badge count:', error);
    }
  },

  /**
   * Clear badge count
   */
  async clearBadgeCount(): Promise<void> {
    try {
      await this.setBadgeCount(0);
    } catch (error) {
      console.error('Error clearing badge count:', error);
    }
  },

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking notification status:', error);
      return false;
    }
  },
};
