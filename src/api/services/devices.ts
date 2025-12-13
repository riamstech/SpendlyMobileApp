import { apiClient } from '../client';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

export interface DeviceRegistrationData {
  device_uuid: string;
  platform: 'ios' | 'android' | 'web';
  fcm_token: string;
  app_version: string;
}

export interface DeviceRegistrationResponse {
  device_id: number;
}

export const devicesService = {
  /**
   * Register device with backend for push notifications
   */
  async registerDevice(
    deviceUUID: string,
    pushToken: string
  ): Promise<DeviceRegistrationResponse> {
    try {
      const platform = Platform.OS as 'ios' | 'android' | 'web';
      const appVersion = Constants.expoConfig?.version || '1.0.0';

      const data: DeviceRegistrationData = {
        device_uuid: deviceUUID,
        platform,
        fcm_token: pushToken, // Expo push token
        app_version: appVersion,
      };

      const response = await apiClient.post<DeviceRegistrationResponse>('/devices', data);
      return response;
    } catch (error: any) {
      console.error('Error registering device:', error);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  },

  /**
   * Update device token (if it changes)
   */
  async updateDeviceToken(
    deviceUUID: string,
    newPushToken: string
  ): Promise<DeviceRegistrationResponse> {
    // The backend uses updateOrCreate, so we can just call register again
    return this.registerDevice(deviceUUID, newPushToken);
  },
};
