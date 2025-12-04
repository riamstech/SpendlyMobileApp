import { Category } from './category';

export interface Investment {
  id: number;
  name: string;
  category: Category;
  category_id: number;
  type: string;
  invested_amount: number;
  currency: string;
  current_value: number;
  start_date: string;
  notes: string;
  recurring: boolean;
  frequency?: string | null;
  reminder_days?: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateInvestmentRequest {
  name: string;
  category_id: number;
  type: string;
  invested_amount: number;
  currency: string;
  current_value: number;
  start_date: string;
  notes?: string;
  recurring?: boolean;
  frequency?: string;
  reminder_days?: number;
}

export interface UpdateInvestmentRequest {
  name?: string;
  category_id?: number;
  type?: string;
  invested_amount?: number;
  currency?: string;
  current_value?: number;
  start_date?: string;
  notes?: string;
  recurring?: boolean;
  frequency?: string;
  reminder_days?: number;
}

export interface InvestmentFilters {
  category_id?: number;
  type?: string;
  recurring?: boolean;
  date_from?: string;
  date_to?: string;
  currency?: string;
  per_page?: number;
  page?: number;
}

