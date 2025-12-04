import { apiClient } from '../client';
import {
  CategoryBudget,
  CreateCategoryBudgetRequest,
  UpdateCategoryBudgetRequest,
  BudgetSummary,
  BudgetFilters,
} from '../types/budget';
import { PaginatedResponse } from '../types/common';
import { transformBudget, transformBudgetForAPI } from '../utils/transformers';

export const budgetsService = {
  /**
   * Get list of category budgets with filters and pagination
   */
  async getCategoryBudgets(filters?: BudgetFilters): Promise<PaginatedResponse<CategoryBudget>> {
    const response = await apiClient.get<PaginatedResponse<CategoryBudget>>('/budgets/categories', { params: filters });
    // Transform each budget in the response
    return {
      ...response,
      data: response.data.map(budget => transformBudget(budget)),
    };
  },

  /**
   * Get a single category budget by ID
   */
  async getCategoryBudget(id: number): Promise<CategoryBudget> {
    const budget = await apiClient.get<CategoryBudget>(`/budgets/categories/${id}`);
    return transformBudget(budget);
  },

  /**
   * Create a new category budget
   */
  async createCategoryBudget(data: CreateCategoryBudgetRequest): Promise<CategoryBudget> {
    const budget = await apiClient.post<CategoryBudget>('/budgets/categories', data);
    return transformBudget(budget);
  },

  /**
   * Update an existing category budget
   */
  async updateCategoryBudget(id: number, data: UpdateCategoryBudgetRequest): Promise<CategoryBudget> {
    const transformed = transformBudgetForAPI(data);
    const budget = await apiClient.put<CategoryBudget>(`/budgets/categories/${id}`, transformed);
    return transformBudget(budget);
  },

  /**
   * Delete a category budget
   */
  async deleteCategoryBudget(id: number): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/budgets/categories/${id}`);
  },

  /**
   * Get budget summary (total budget, spent, remaining)
   */
  async getBudgetSummary(): Promise<BudgetSummary> {
    return apiClient.get<BudgetSummary>('/budgets/summary');
  },
};

