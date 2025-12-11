export interface CategoryBudget {
  id: number;
  category: string;
  budget_amount: number;
  currency: string;
  period: 'monthly' | 'weekly' | 'yearly';
  start_date: string;
  end_date: string;
  spent: number;
  remaining: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryBudgetRequest {
  category: string;
  budget_amount: number;
  currency: string;
  period: 'monthly' | 'weekly' | 'yearly';
  start_date: string;
  end_date: string;
  user_id?: number;
  budget_cycle_day?: number;
}

export interface UpdateCategoryBudgetRequest {
  category?: string;
  budget_amount?: number;
  currency?: string;
  period?: 'monthly' | 'weekly' | 'yearly';
  start_date?: string;
  end_date?: string;
}

export interface BudgetSummary {
  // Support both snake_case (raw API) and camelCase (transformed by API client)
  total_budget?: number;
  totalBudget?: number;
  total_spent?: number;
  totalSpent?: number;
  remaining: number;
  currency: string;
}

export interface BudgetFilters {
  category?: string;
  period?: 'monthly' | 'weekly' | 'yearly';
  per_page?: number;
  page?: number;
  all?: boolean;
}

