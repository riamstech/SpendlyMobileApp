import { apiClient } from '../client';

export interface FinancialSummary {
  // Support both camelCase (from API client) and snake_case
  total_assets?: number;
  totalAssets?: number;
  total_liabilities?: number;
  totalLiabilities?: number;
  net_worth?: number;
  netWorth?: number;
  assets?: any[];
  liabilities: {
    id: number;
    description: string;
    amount: number;
    remaining_amount?: number;
    remainingAmount?: number;
    paid_amount?: number;
    paidAmount?: number;
    progress: number;
    end_date?: string;
    endDate?: string;
    type: string;
  }[];
}

export const financialService = {
  /**
   * Get financial summary (assets, liabilities, net worth)
   */
  async getSummary(): Promise<FinancialSummary> {
    // apiClient.get() already returns response.data (transformed to camelCase)
    const data = await apiClient.get<any>('/financial-summary');
    
    // Handle both snake_case (direct from backend) and camelCase (from API client transformation)
    const assets = data.assets || {};
    const liabilities = data.liabilities || {};
    
    // Assets structure from backend: { total, investments, savings }
    const totalAssets = assets?.total || 0;
    
    // Liabilities structure from backend: { total, loans: [...] }
    const totalLiabilities = liabilities?.total || 0;
    const loans = liabilities?.loans || [];
    
    return {
      total_assets: totalAssets,
      total_liabilities: totalLiabilities,
      net_worth: data.net_worth || data.netWorth || 0,
      assets: [], // Backend doesn't return assets array, only totals
      liabilities: loans.map((loan: any) => ({
        id: loan.id,
        description: loan.description || 'Loan',
        amount: loan.original_amount || loan.originalAmount || loan.amount || 0,
        remaining_amount: loan.remaining_balance || loan.remainingBalance || loan.remaining_amount || 0,
        paid_amount: (loan.original_amount || loan.originalAmount || loan.amount || 0) - (loan.remaining_balance || loan.remainingBalance || loan.remaining_amount || 0),
        progress: loan.progress_percentage || loan.progressPercentage || loan.progress || 0,
        end_date: loan.end_date || loan.endDate || '',
        type: loan.type || 'other',
      })),
    };
  },
};
