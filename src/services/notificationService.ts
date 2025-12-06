import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';

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
      // For Firebase, request permission
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('✅ Firebase authorization status:', authStatus);
      }

      // Also request Expo permissions for local notifications
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      return {
        granted: enabled && finalStatus === 'granted',
        canAskAgain: finalStatus !== 'denied',
        status: finalStatus,
      };
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'error',
      };
    }
  },

  /**
   * Get the Firebase Cloud Messaging (FCM) token
   */
  async getFCMToken(): Promise<string | null> {
    try {
      // Check if running on a physical device
      if (!Device.isDevice) {
        console.warn('Push notifications only work on physical devices');
        return null;
      }

      // Get FCM token
      const token = await messaging().getToken();
      console.log('✅ FCM Token obtained:', token.substring(0, 20) + '...');
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  },

  /**
   * Get the Expo push token (fallback for Expo Go)
   */
  async getExpoPushToken(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.warn('Push notifications only work on physical devices');
        return null;
      }

      const { granted } = await this.requestPermissions();
      if (!granted) {
        console.warn('Notification permissions not granted');
        return null;
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      
      if (!projectId) {
        console.error('Project ID not found in app config');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      console.log('Expo Push Token:', token.data);
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
   * Set up Firebase message listeners
   */
  setupFirebaseListeners(
    onMessageReceived: (message: any) => void,
    onNotificationOpened: (message: any) => void
  ) {
    // Handle foreground messages
    const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
      console.log('🔔 Firebase message received (foreground):', remoteMessage);
      onMessageReceived(remoteMessage);
    });

    // Handle notification opened (app in background/quit)
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('👆 Notification opened app from background:', remoteMessage);
      onNotificationOpened(remoteMessage);
    });

    // Handle notification opened (app was quit)
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('👆 Notification opened app from quit state:', remoteMessage);
          onNotificationOpened(remoteMessage);
        }
      });

    return unsubscribeForeground;
  },

  /**
   * Add notification received listener (Expo - for local notifications)
   */
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
  },

  /**
   * Add notification response listener (Expo - for local notifications)
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
      await Notifications.setNotificationCategoryAsync(
        categories[0].identifier,
        categories[0].actions.map(action => ({
          identifier: action.identifier,
          buttonTitle: action.title,
          options: {
            opensAppToForeground: action.options?.foreground ?? true,
            isDestructive: action.options?.destructive ?? false,
            isAuthenticationRequired: action.options?.authenticationRequired ?? false,
          },
        }))
      );
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
   * Subscribe to a topic (Firebase)
   */
  async subscribeToTopic(topic: string): Promise<void> {
    try {
      await messaging().subscribeToTopic(topic);
      console.log(`✅ Subscribed to topic: ${topic}`);
    } catch (error) {
      console.error(`Error subscribing to topic ${topic}:`, error);
    }
  },

  /**
   * Unsubscribe from a topic (Firebase)
   */
  async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      await messaging().unsubscribeFromTopic(topic);
      console.log(`✅ Unsubscribed from topic: ${topic}`);
    } catch (error) {
      console.error(`Error unsubscribing from topic ${topic}:`, error);
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
