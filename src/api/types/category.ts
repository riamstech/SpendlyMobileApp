export interface Category {
  id: number | null;
  name: string;
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

