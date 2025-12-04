import { apiClient } from '../client';

export interface InsightsSummary {
  total_receipts: number;
  total_receipt_amount: number;
  total_transactions: number;
  total_transaction_amount: number;
  total_expenses: number;
  average_receipt_amount: number;
  receipts_with_ocr: number;
}

export interface MerchantBreakdown {
  merchant: string;
  count: number;
  total: number;
  average: number;
}

export interface SpendingTrend {
  date: string;
  count: number;
  amount: number;
}

export interface TopMerchant {
  merchant: string;
  visits: number;
  total_spent: number;
}

export interface ReceiptStats {
  total: number;
  with_amount: number;
  with_merchant: number;
  with_category: number;
  with_ocr: number;
  completion_rate: number;
}

export interface SmartInsight {
  type: string;
  title: string;
  description: string;
  icon: string;
}

export interface InsightsData {
  summary: InsightsSummary;
  merchant_breakdown: MerchantBreakdown[];
  category_insights: any;
  spending_trends: SpendingTrend[];
  top_merchants: TopMerchant[];
  receipt_stats: ReceiptStats;
  smart_insights: SmartInsight[];
}

export const insightsApi = {
  // Get insights for a specific period
  getInsights: (period: number = 30) =>
    apiClient.get<InsightsData>(`/insights?period=${period}`),
};
