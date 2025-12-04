import { apiClient } from '../client';
import {
  Investment,
  CreateInvestmentRequest,
  UpdateInvestmentRequest,
  InvestmentFilters,
} from '../types/investment';
import { PaginatedResponse } from '../types/common';
import { transformInvestment, transformInvestmentForAPI } from '../utils/transformers';

export const investmentsService = {
  /**
   * Get list of investments with filters and pagination
   */
  async getInvestments(filters?: InvestmentFilters): Promise<PaginatedResponse<Investment>> {
    return apiClient.get<PaginatedResponse<Investment>>('/investments', { params: filters });
  },

  /**
   * Get a single investment by ID
   */
  async getInvestment(id: number): Promise<Investment> {
    const investment = await apiClient.get<Investment>(`/investments/${id}`);
    return transformInvestment(investment);
  },

  /**
   * Create a new investment
   */
  async createInvestment(data: CreateInvestmentRequest): Promise<Investment> {
    const transformed = transformInvestmentForAPI(data);
    const investment = await apiClient.post<Investment>('/investments', transformed);
    return transformInvestment(investment);
  },

  /**
   * Update an existing investment
   */
  async updateInvestment(id: number, data: UpdateInvestmentRequest): Promise<Investment> {
    const transformed = transformInvestmentForAPI(data);
    const investment = await apiClient.put<Investment>(`/investments/${id}`, transformed);
    return transformInvestment(investment);
  },

  /**
   * Delete an investment
   */
  async deleteInvestment(id: number): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/investments/${id}`);
  },
};

