import { apiClient } from '../client';
import { Notification, NotificationFilters } from '../types/notification';
import { PaginatedResponse } from '../types/common';

export const notificationsService = {
  /**
   * Get list of notifications with filters and pagination
   */
  async getNotifications(filters?: NotificationFilters): Promise<PaginatedResponse<Notification>> {
    return apiClient.get<PaginatedResponse<Notification>>('/notifications', { params: filters });
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(id: number): Promise<Notification> {
    return apiClient.patch<Notification>(`/notifications/${id}/read`);
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ message: string }> {
    return apiClient.patch<{ message: string }>('/notifications/read-all');
  },

  /**
   * Delete a notification
   */
  async deleteNotification(id: number): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/notifications/${id}`);
  },
};

