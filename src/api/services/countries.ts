import { apiClient } from '../client';

export interface Country {
  code: string;
  name: string;
  original_name?: string;
}

export const countriesService = {
  /**
   * Get all countries with translations
   *
   * Backend returns { data: Country[] }
   */
  async getCountries(): Promise<Country[]> {
    try {
      const response = await apiClient.get<any>('/countries');
      
      // Handle different response formats
      if (Array.isArray(response)) {
        // Direct array response
        return response as Country[];
      } else if (response?.data && Array.isArray(response.data)) {
        // Wrapped in data property
        return response.data as Country[];
      } else {
        console.warn('countriesService: Unexpected response format:', response);
        return [];
      }
    } catch (error: any) {
      console.error('countriesService: Error fetching countries:', error);
      // Return empty array instead of throwing to prevent UI breakage
      return [];
    }
  },
};
