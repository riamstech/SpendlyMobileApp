import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { currenciesService } from '../api/services/currencies';
import { Currency } from '../api/types/category';

/**
 * Custom hook to load and manage currencies
 * Automatically refetches currencies when language changes
 */
export function useCurrencies() {
  const { i18n } = useTranslation('common');
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadCurrencies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`[useCurrencies] Loading currencies (language: ${i18n.language})...`);
      const response = await currenciesService.getCurrencies();
      
      console.log(`[useCurrencies] Loaded ${response.length} currencies`);
      setCurrencies(response);
    } catch (err: any) {
      console.error('[useCurrencies] Error loading currencies:', err);
      setError(err);
      setCurrencies([]);
    } finally {
      setLoading(false);
    }
  }, [i18n.language]);

  // Load currencies on mount and when language changes
  useEffect(() => {
    loadCurrencies();
  }, [loadCurrencies]);

  // Listen to language changes and refetch currencies
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      console.log(`[useCurrencies] Language changed to ${lng}, refetching currencies...`);
      loadCurrencies();
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n, loadCurrencies]);

  return { currencies, loading, error, refetch: loadCurrencies };
}

