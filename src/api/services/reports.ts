import { apiClient } from '../client';
import { config } from '../../config/env';
import {
  MonthlyReportResponse,
  CategoryReportResponse,
} from '../types/report';

export const reportsService = {
  /**
   * Get monthly report with income, expenses, and savings breakdown
   */
  async getMonthlyReport(year?: number, currency?: string): Promise<MonthlyReportResponse> {
    const params: Record<string, any> = {};
    if (year) params.year = year;
    if (currency) params.currency = currency;
    return apiClient.get<MonthlyReportResponse>('/reports/monthly', { params });
  },

  /**
   * Get category-wise spending report
   */
  async getCategoryReport(fromDate?: string, toDate?: string, currency?: string): Promise<CategoryReportResponse> {
    const params: Record<string, string> = {};
    if (fromDate) params.from_date = fromDate;
    if (toDate) params.to_date = toDate;
    if (currency) params.currency = currency;
    
    return apiClient.get<CategoryReportResponse>('/reports/categories', { params });
  },

  /**
   * Export PDF report from backend
   * Returns HTML string that can be converted to PDF
   */
  async exportPdf(fromDate?: string, toDate?: string, currency?: string, language: string = 'en'): Promise<string> {
    const params: Record<string, string> = {};
    if (fromDate) params.from_date = fromDate;
    if (toDate) params.to_date = toDate;
    if (currency) params.currency = currency;
    if (language) params.locale = language;
    
    // Use fetch directly to get HTML response
    const token = await apiClient.getTokenAsync();
    
    // Build query string manually to ensure compatibility across all React Native platforms
    const queryParts: string[] = [];
    Object.keys(params).forEach(key => {
      if (params[key]) {
        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`);
      }
    });
    const queryString = queryParts.length > 0 ? queryParts.join('&') : '';
    const url = `${config.apiBaseUrl}/reports/export/pdf${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/html',
        'Accept-Language': language,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('PDF error response:', errorText);
      throw new Error(`Failed to fetch PDF (${response.status}): ${errorText || response.statusText}`);
    }
    
    return await response.text();
  },

  /**
   * Export CSV report from backend
   * Returns CSV string
   * Similar to exportPdf but returns CSV text instead of HTML
   * Uses fetch with Accept-Language header to ensure translations work
   */
  async exportCsv(fromDate?: string, toDate?: string, currency?: string, language: string = 'en'): Promise<string> {
    const params: Record<string, string> = {};
    if (fromDate) params.from_date = fromDate;
    if (toDate) params.to_date = toDate;
    if (currency) params.currency = currency;
    if (language) params.locale = language;
    
    // Get token for headers
    const token = await apiClient.getTokenAsync();
    
    // Build query string manually to ensure compatibility across all React Native platforms
    const queryParts: string[] = [];
    Object.keys(params).forEach(key => {
      if (params[key]) {
        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`);
      }
    });
    const queryString = queryParts.length > 0 ? queryParts.join('&') : '';
    const url = `${config.apiBaseUrl}/reports/export/csv${queryString ? `?${queryString}` : ''}`;
    
    // Use fetch with Accept-Language header to ensure backend translates content
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/csv',
        'Accept-Language': language,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('CSV error response:', errorText);
      throw new Error(`Failed to fetch CSV (${response.status}): ${errorText || response.statusText}`);
    }
    
    return await response.text();
  },
};

