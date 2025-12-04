import { apiClient } from '../client';
import {
  RecurringPayment,
  CreateRecurringPaymentRequest,
  UpdateRecurringPaymentRequest,
  RecurringPaymentFilters,
} from '../types/recurring';
import { PaginatedResponse } from '../types/common';
import { transformRecurringPayment, transformRecurringPaymentForAPI } from '../utils/transformers';

export const recurringService = {
  /**
   * Get list of recurring payments with filters and pagination
   */
  async getRecurringPayments(filters?: RecurringPaymentFilters): Promise<PaginatedResponse<RecurringPayment>> {
    const response = await apiClient.get<PaginatedResponse<RecurringPayment>>('/recurring-payments', { params: filters });
    // Transform each payment in the response
    return {
      ...response,
      data: response.data.map(payment => transformRecurringPayment(payment)),
    };
  },

  /**
   * Get a single recurring payment by ID
   */
  async getRecurringPayment(id: number): Promise<RecurringPayment> {
    const payment = await apiClient.get<RecurringPayment>(`/recurring-payments/${id}`);
    return transformRecurringPayment(payment);
  },

  /**
   * Create a new recurring payment
   */
  async createRecurringPayment(data: CreateRecurringPaymentRequest): Promise<RecurringPayment> {
    const payment = await apiClient.post<RecurringPayment>('/recurring-payments', data);
    return transformRecurringPayment(payment);
  },

  /**
   * Update an existing recurring payment
   */
  async updateRecurringPayment(id: number, data: UpdateRecurringPaymentRequest): Promise<RecurringPayment> {
    const transformed = transformRecurringPaymentForAPI(data);
    const payment = await apiClient.put<RecurringPayment>(`/recurring-payments/${id}`, transformed);
    return transformRecurringPayment(payment);
  },

  /**
   * Delete a recurring payment
   */
  async deleteRecurringPayment(id: number): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/recurring-payments/${id}`);
  },

  /**
   * Get upcoming recurring payments (due within specified days)
   */
  async getUpcomingPayments(days: number = 30): Promise<RecurringPayment[]> {
    const response = await apiClient.get<PaginatedResponse<RecurringPayment>>('/recurring-payments', {
      params: { upcoming_days: days, is_active: true },
    });
    return response.data.map(payment => transformRecurringPayment(payment));
  },
};

