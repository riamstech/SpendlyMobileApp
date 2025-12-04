import { apiClient } from '../client';
import { config } from '../../config/env';
import {
  UpdateUserRequest,
  UpdateUserSettingsRequest,
  UserSettingsResponse,
  BackupDataResponse,
} from '../types/user';
import { User } from '../types/auth';

export const usersService = {
  /**
   * Get user by ID
   */
  async getUser(id: number): Promise<User> {
    const response = await apiClient.get<{ data: User }>(`/users/${id}`);
    return response.data;
  },

  /**
   * Update user profile
   */
  async updateUser(id: number, data: UpdateUserRequest): Promise<User> {
    const response = await apiClient.put<{ data: User }>(`/users/${id}`, data);
    return response.data;
  },

  /**
   * Get user settings
   */
  async getUserSettings(): Promise<UserSettingsResponse> {
    return apiClient.get<UserSettingsResponse>('/user/settings');
  },

  /**
   * Update user settings
   */
  async updateUserSettings(data: UpdateUserSettingsRequest): Promise<UserSettingsResponse> {
    return apiClient.put<UserSettingsResponse>('/user/settings', data);
  },

  /**
   * Delete user account
   */
  async deleteAccount(): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>('/user/account');
  },

  /**
   * Backup user data
   */
  async backupData(): Promise<BackupDataResponse> {
    return apiClient.post<BackupDataResponse>('/user/backup');
  },

  /**
   * Upload user avatar
   * Accepts both web File objects and React Native FormData
   */
  async uploadAvatar(file: File | FormData): Promise<{ message: string; avatar_url: string; avatar?: string }> {
    let formData: FormData;
    if (file instanceof FormData) {
      formData = file;
    } else {
      formData = new FormData();
      formData.append('avatar', file);
    }
    return apiClient.postFormData<{ message: string; avatar_url: string; avatar?: string }>('/user/avatar', formData);
  },

  /**
   * Delete user avatar
   */
  async deleteAvatar(): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>('/user/avatar');
  },

  /**
   * Get full avatar URL from relative path
   */
  getAvatarUrl(avatarPath?: string | null): string | undefined {
    if (!avatarPath) return undefined;
    // If already a full URL, return as is
    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
      return avatarPath;
    }
    // Otherwise, prepend storage URL
    return `${config.storageUrl}/${avatarPath}`;
  },
};

