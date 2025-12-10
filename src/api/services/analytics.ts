import { apiClient } from '../client';

export interface SpendingTrend {
  period: string;
  label: string;
  income: number;
  expense: number;
  net: number;
  savingsRate: number; // camelCase after API client transformation
  savings_rate?: number; // Keep for backward compatibility
}

export interface CategoryBreakdownItem {
  category: string; // Translated category name from backend
  original_category?: string; // Original English category name (provided by backend)
  icon: string;
  color: string;
  total: number;
  count: number;
  percentage: number;
}

export interface Insight {
  type: string;
  title: string;
  message: string;
  value?: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  icon: string;
  category?: string;
  percentage?: number;
  daily_average?: number;
  projected_total?: number;
}

export interface HealthScoreFactor {
  name: string;
  score: number;
  max: number;
  value: string;
  status: 'excellent' | 'good' | 'needs_improvement';
}

export interface HealthScore {
  score: number;
  max_score: number;
  grade: string;
  factors: HealthScoreFactor[];
  recommendations: string[];
}

export const analyticsService = {
  async getSpendingTrends(params?: { period?: string; months?: number }) {
    const response = await apiClient.get<{
      trends: SpendingTrend[];
      period: string;
      start_date: string;
      end_date: string;
    }>('/analytics/spending-trends', { params });
    return response;
  },

  async getCategoryBreakdown(params?: { months?: number; type?: 'expense' | 'income' }) {
    const response = await apiClient.get<{
      breakdown: CategoryBreakdownItem[];
      total: number;
      type: string;
      period: { start: string; end: string };
    }>('/analytics/category-breakdown', { params });
    return response;
  },

  async getInsights() {
    const response = await apiClient.get<{
      insights: Insight[];
      summary: {
        current_income: number;
        current_expense: number;
        net_savings: number;
        last_month_expense: number;
      };
    }>('/analytics/insights');
    return response;
  },

  async getHealthScore() {
    const response = await apiClient.get<HealthScore>('/analytics/health-score');
    return response;
  },
};
