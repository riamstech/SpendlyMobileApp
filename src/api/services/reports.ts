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
  async exportPdf(fromDate?: string, toDate?: string, currency?: string): Promise<string> {
    const params: Record<string, string> = {};
    if (fromDate) params.from_date = fromDate;
    if (toDate) params.to_date = toDate;
    if (currency) params.currency = currency;
    
    // Use fetch directly to get HTML response
    const token = await apiClient.getTokenAsync();
    
    const queryString = new URLSearchParams(params).toString();
    const url = `${config.apiBaseUrl}/reports/export/pdf${queryString ? `?${queryString}` : ''}`;
    
    console.log('PDF export URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/html',
      },
    });
    
    console.log('PDF response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('PDF error response:', errorText);
      throw new Error(`Failed to fetch PDF (${response.status}): ${errorText || response.statusText}`);
    }
    
    return await response.text();
  },
};

