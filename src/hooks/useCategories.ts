import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { categoriesService } from '../api/services/categories';
import { Category } from '../api/types/category';

/**
 * Custom hook to load and manage categories
 * Automatically refetches categories when language changes
 */
export function useCategories(type?: 'income' | 'expense' | 'investment') {
  const { i18n } = useTranslation('common');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await categoriesService.getCategories(type);
      
      // Handle different response formats
      let allCategories: Category[] = [];
      if (response.all && Array.isArray(response.all)) {
        allCategories = response.all;
      } else if (response.system || response.custom) {
        allCategories = [
          ...(response.system || []),
          ...(response.custom || []),
        ];
      } else if (Array.isArray(response)) {
        allCategories = response;
      }
      
      setCategories(allCategories);
    } catch (err: any) {
      console.error('[useCategories] Error loading categories:', err);
      setError(err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [type, i18n.language]);

  // Load categories on mount and when language changes
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Listen to language changes and refetch categories
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      loadCategories();
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n, loadCategories]);

  return { categories, loading, error, refetch: loadCategories };
}

