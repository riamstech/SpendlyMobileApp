export interface MonthlyReportData {
  month: string;
  month_name: string;
  income: number;
  expenses: number;
  savings: number;
}

export interface MonthlyReportResponse {
  year: number;
  currency: string;
  data: MonthlyReportData[];
}

export interface CategoryReportData {
  category: string;
  total_spent: number;
  transaction_count: number;
}

export interface CategoryReportResponse {
  from_date: string;
  to_date: string;
  currency: string;
  data: CategoryReportData[];
}

