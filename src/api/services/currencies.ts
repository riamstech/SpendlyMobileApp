import { apiClient } from '../client';
import { Currency } from '../types/category';

// Re-export Currency type for use in other files
export type { Currency };

export const currenciesService = {
  /**
   * Get all active currencies
   *
   * Backend may return either:
   * - an array: Currency[]
   * - or an object: { data: Currency[] }
   *
   * This helper normalises both shapes into a simple Currency[].
   */
  async getCurrencies(): Promise<Currency[]> {
    try {
      // Backend returns { data: [...] }
      // API client's get() returns response.data (which is the body of the HTTP response)
      // So if backend returns { data: [...] }, apiClient.get() returns { data: [...] }
      const response = await apiClient.get<any>('/currencies');
      
      // Handle different response formats
      if (Array.isArray(response)) {
        // Direct array response
        return response as Currency[];
      } else if (response?.data && Array.isArray(response.data)) {
        // Wrapped in data property
        return response.data as Currency[];
      } else {
        console.warn('currenciesService: Unexpected response format:', response);
        return [];
      }
    } catch (error: any) {
      console.error('currenciesService: Error fetching currencies:', error);
      // Return empty array instead of throwing to prevent UI breakage
      return [];
    }
  },
};
