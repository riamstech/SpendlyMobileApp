import { apiClient } from '../client';
import { CategoriesResponse, Category } from '../types/category';

export type { Category };

export const categoriesService = {
  /**
   * Get list of all categories (system and custom)
   * @param type - Optional filter by 'income', 'expense', or 'investment'
   */
  async getCategories(type?: 'income' | 'expense' | 'investment'): Promise<CategoriesResponse> {
    const params = type ? { type } : {};
    return apiClient.get<CategoriesResponse>('/categories', { params });
  },
};

