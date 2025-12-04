// API response in snake_case (before transformation)
export interface DashboardSummaryResponse {
  total_income: number;
  total_expenses: number;
  total_savings: number;
  transaction_count: number;
  transaction_limit: number | null;
  currency: string;
  from_date: string;
  to_date: string;
  budget_cycle_day: number;
}

// Transformed response in camelCase (after API client transformation)
export interface DashboardSummary {
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  transactionCount: number;
  transactionLimit: number | null;
  currency: string;
  fromDate: string;
  toDate: string;
  budgetCycleDay: number;
}

