export interface Category {
  id: number | null;
  name: string; // Translated name from backend (based on Accept-Language header)
  original_name?: string; // Original English name (provided by backend)
  type: 'income' | 'expense' | 'both' | 'investment';
  icon: string | null;
  color: string | null;
  description?: string | null;
  is_system?: boolean;
}

export interface CategoriesResponse {
  system: Category[];
  custom: Category[];
  all: Category[];
  predefined: string[]; // Legacy support
}

