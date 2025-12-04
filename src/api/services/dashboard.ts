import { apiClient } from '../client';
import { DashboardSummary } from '../types/dashboard';

export const dashboardService = {
  /**
   * Get dashboard summary with totals and statistics
   * Returns data in camelCase (transformed by API client)
   * Note: API response body is { data: {...} }, and axios wraps it, so we need to unwrap
   */
  async getSummary(fromDate?: string, toDate?: string): Promise<DashboardSummary> {
    const params: Record<string, string> = {};
    if (fromDate) params.from_date = fromDate;
    if (toDate) params.to_date = toDate;
    
    // API returns { data: {total_income: ...} } as response body
    // Axios wraps it: response.data = { data: {total_income: ...} }
    // API client transforms to: response.data = { data: {totalIncome: ...} }
    // apiClient.get() returns: { data: {totalIncome: ...} }
    const response = await apiClient.get<any>('/dashboard/summary', { params });
    
    // Unwrap the data property
    // Response structure: { data: { totalIncome: ..., totalExpenses: ... } }
    if (response && response.data) {
      return response.data as DashboardSummary;
    }
    // Fallback: if response is already unwrapped
    return response as DashboardSummary;
  },
};

