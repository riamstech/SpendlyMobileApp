export interface RecurringPayment {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  category: string; // Translated category name from backend (based on Accept-Language header)
  original_category?: string; // Original English category name (provided by backend)
  frequency: 'monthly' | 'weekly' | 'custom';
  next_due_date: string;
  reminder_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateRecurringPaymentRequest {
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  category: string;
  frequency: 'monthly' | 'weekly' | 'custom';
  next_due_date: string;
  reminder_days: number;
  is_active?: boolean;
}

export interface UpdateRecurringPaymentRequest {
  type?: 'income' | 'expense';
  amount?: number;
  currency?: string;
  category?: string;
  frequency?: 'monthly' | 'weekly' | 'custom';
  next_due_date?: string;
  reminder_days?: number;
  is_active?: boolean;
}

export interface RecurringPaymentFilters {
  category?: string;
  frequency?: 'monthly' | 'weekly' | 'custom';
  is_active?: boolean;
  upcoming_days?: number;
  per_page?: number;
  page?: number;
}

