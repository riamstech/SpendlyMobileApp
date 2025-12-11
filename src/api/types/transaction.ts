export interface Transaction {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  category: string; // Translated category name from backend (based on Accept-Language header)
  original_category?: string; // Original English category name (provided by backend)
  date: string;
  notes: string;
  is_recurring: boolean;
  recurring_frequency?: string | null;
  reminder_days?: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTransactionRequest {
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  category: string;
  date: string;
  notes: string;
  is_recurring?: boolean;
  recurring_frequency?: string;
  reminder_days?: number;
  is_loan?: boolean;
  loan_amount?: number | null;
  loan_end_date?: string | null;
  loan_type?: string | null;
}

export interface UpdateTransactionRequest {
  type?: 'income' | 'expense';
  amount?: number;
  currency?: string;
  category?: string;
  date?: string;
  notes?: string;
  is_recurring?: boolean;
  recurring_frequency?: string;
  reminder_days?: number;
  is_loan?: boolean;
  loan_amount?: number | null;
  loan_end_date?: string | null;
  loan_type?: string | null;
}

export interface TransactionFilters {
  type?: 'income' | 'expense';
  category?: string;
  from_date?: string;
  to_date?: string;
  per_page?: number;
  page?: number;
}

