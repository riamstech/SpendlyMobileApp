import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  RefreshControl,
  useWindowDimensions,
  Modal,
  ActivityIndicator,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import Constants from 'expo-constants';
import { fonts, textStyles, createResponsiveTextStyles } from '../constants/fonts';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  X,
  ChevronDown,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Landmark,
} from 'lucide-react-native';
import {
  BarChart,
  LineChart,
  PieChart,
} from 'react-native-chart-kit';
import { reportsService } from '../api/services/reports';
import { currenciesService } from '../api/services/currencies';
import { useCurrencies } from '../hooks/useCurrencies';
import { categoriesService } from '../api/services/categories';
import { authService } from '../api/services/auth';
import { transactionsService } from '../api/services/transactions';
import { investmentsService } from '../api/services/investments';
import { getDateRangeFromString, formatDateForAPI, formatDateForDisplay as formatDateForDisplayUtil } from '../api/utils/dateUtils';
import { translateCategoryName } from '../utils/categoryTranslator';
import { translateCurrencyName } from '../utils/currencyTranslator';
import Analytics from '../components/Analytics';
import { useCategories } from '../hooks/useCategories';
import { useTheme } from '../contexts/ThemeContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { showToast } from '../utils/toast';
import { useDeviceType, useResponsiveLayout } from '../hooks/useDeviceType';

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
  percentage: number;
  currency?: string;
}

export default function ReportsScreen() {
  const { t, i18n } = useTranslation('common');
  const { width } = useWindowDimensions();
  const { isDark, colors } = useTheme();
  const { isTablet } = useDeviceType();
  const { padding, gap } = useResponsiveLayout();
  const [loading, setLoading] = useState(true);
  const [languageKey, setLanguageKey] = useState(i18n.language); // Force re-render on language change
  const [refreshing, setRefreshing] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [selectedCurrency, setSelectedCurrency] = useState('ALL');
  const [dateRange, setDateRange] = useState('currentMonth');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [activeTab, setActiveTab] = useState<'reports' | 'analytics'>('reports');
  
  // Date picker states
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  
  // Data states
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalSavings, setTotalSavings] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  
  // Filter modals
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  // Use useCurrencies hook for automatic refetch on language change
  const { currencies: currenciesData } = useCurrencies();
  // Use useCategories hook for automatic refetch on language change
  const { categories: allCategoriesData } = useCategories();
  const [allCategories, setAllCategories] = useState<Array<{ name: string; color?: string | null }>>([]);
  const [currencySearch, setCurrencySearch] = useState('');
  
  // Sync categories from hook to local state (for compatibility with existing code)
  useEffect(() => {
    if (allCategoriesData && allCategoriesData.length > 0) {
      setAllCategories(allCategoriesData.map(cat => ({
        name: cat.name,
        color: cat.color || null,
      })));
    }
  }, [allCategoriesData]);

  const [currencies, setCurrencies] = useState<Array<{ code: string; symbol: string; name?: string; flag?: string; original_name?: string }>>([]);
  
  // Sync currencies from hook to local state (for compatibility with existing code)
  useEffect(() => {
    if (currenciesData && currenciesData.length > 0) {
      setCurrencies(currenciesData);
    }
  }, [currenciesData]);

  const responsiveTextStyles = createResponsiveTextStyles(width);



  useEffect(() => {
    loadInitialData();
  }, []);

  // Listen to language changes and force re-render
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setLanguageKey(lng);
    };
    
    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  useEffect(() => {
    if (currency) {
      // For custom date range, only reload when BOTH dates are set
      if (dateRange === 'custom') {
        if (customDateFrom && customDateTo) {
          loadReportsData();
        }
        // Don't reload if only one date is set (user is still picking)
      } else {
        loadReportsData();
      }
    }
  }, [dateRange, customDateFrom, customDateTo, selectedCurrency, currency, languageKey]);

  const loadInitialData = async () => {
    try {
      // Use Promise.all to fetch initial data in parallel
      const [userData] = await Promise.all([
        authService.getCurrentUser(),
        // Currencies are now loaded via useCurrencies hook
        // Categories are now loaded via useCategories hook
      ]);

      // Process user currency
      const defaultCurrency = userData.defaultCurrency || 'USD';
      setCurrency(defaultCurrency);
      setSelectedCurrency(defaultCurrency); // Default to user's base currency

      // Categories are now loaded via useCategories hook, skip manual setting

    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const loadReportsData = async () => {
    try {
      setLoading(true);
      
      // Get date range
      let from: string, to: string;
      if (dateRange === 'custom') {
        if (!customDateFrom || !customDateTo) {
          setLoading(false);
          return;
        }
        from = customDateFrom;
        to = customDateTo;
      } else {
        const dateRangeResult = getDateRangeFromString(dateRange);
        from = dateRangeResult.from;
        to = dateRangeResult.to;
      }
      
      // Determine API currency filter
      const apiCurrencyFilter = selectedCurrency === 'ALL' ? undefined : selectedCurrency;
      
      // Build promises for parallel execution
      const promises: Promise<any>[] = [
        reportsService.getCategoryReport(from, to, apiCurrencyFilter),
        // Monthly reports promises
      ];
      
      const fromDate = new Date(from + 'T00:00:00');
      const toDate = new Date(to + 'T23:59:59');
      const fromYear = fromDate.getFullYear();
      const toYear = toDate.getFullYear();

      for (let year = fromYear; year <= toYear; year++) {
        promises.push(reportsService.getMonthlyReport(year, apiCurrencyFilter));
      }

      // Transactions promise
      const transactionFilters: any = {
        from_date: from,
        to_date: to,
        per_page: 1000,
      };
      if (apiCurrencyFilter) transactionFilters.currency = apiCurrencyFilter;
      promises.push(transactionsService.getTransactions(transactionFilters));

      // Investments promise
      const investmentFilters: any = {
        date_from: from,
        date_to: to,
        per_page: 1000, 
      };
      if (apiCurrencyFilter) investmentFilters.currency = apiCurrencyFilter;
      promises.push(investmentsService.getInvestments(investmentFilters));

      // Execute all promises in parallel
      const results = await Promise.all(promises);

      // Extract results
      const categoryReport = results[0];
      const monthlyReportsStartIdx = 1;
      const monthlyReportsCount = (toYear - fromYear) + 1;
      const monthlyReports = results.slice(monthlyReportsStartIdx, monthlyReportsStartIdx + monthlyReportsCount);
      const transactionsResponse = results[monthlyReportsStartIdx + monthlyReportsCount];
      const investmentsResponse = results[monthlyReportsStartIdx + monthlyReportsCount + 1];

      // --- Process Category Data ---
      const categoryReportData = Array.isArray(categoryReport.data) ? categoryReport.data : [];
      const processedCategoryData = categoryReportData
        .map((c: any) => {
          const categoryCurrency = c.currency || currency;
          const shouldInclude = selectedCurrency === 'ALL' || categoryCurrency === selectedCurrency;
          
          return {
            name: getCategoryDisplayName(c.category),
            value: shouldInclude ? (c.totalSpent || c.total_spent || 0) : 0,
            color: getCategoryColor(c.category),
            percentage: 0, 
            currency: categoryCurrency,
          };
        })
        .filter((cat: CategoryData) => cat.value > 0)
        .sort((a: CategoryData, b: CategoryData) => b.value - a.value);
      
      const categoriesInSelectedCurrency = selectedCurrency === 'ALL' 
        ? processedCategoryData 
        : processedCategoryData.filter((cat: CategoryData) => cat.currency === selectedCurrency);
      
      const calculatedTotalExpensesFromCategories = categoriesInSelectedCurrency.reduce((sum: number, cat: CategoryData) => sum + cat.value, 0);
      
      processedCategoryData.forEach((cat: CategoryData) => {
        const isInSelectedCurrency = selectedCurrency === 'ALL' || cat.currency === selectedCurrency;
        cat.percentage = (isInSelectedCurrency && calculatedTotalExpensesFromCategories > 0)
          ? (cat.value / calculatedTotalExpensesFromCategories) * 100 
          : 0;
      });
      
      setCategoryData(processedCategoryData);

      // --- Process Monthly Data ---
      let allMonthlyData: any[] = [];
      monthlyReports.forEach(report => {
        const reportData = report.data.map((m: any) => {
          let monthDate: Date;
          if (m.month && typeof m.month === 'string' && m.month.match(/^\d{4}-\d{2}$/)) {
            monthDate = new Date(m.month + '-01T00:00:00');
          } else {
            monthDate = new Date();
          }
          
          const currentLocale = getLocaleForLanguage(i18n.language);
          const monthDisplay = monthDate.toLocaleDateString(currentLocale, { month: 'short' });
          
          return {
            month: monthDisplay,
            income: m.income || 0,
            expenses: m.expenses || 0,
            savings: m.savings || 0,
            monthDate: monthDate,
          };
        });
        allMonthlyData = [...allMonthlyData, ...reportData];
      });
      
      const rawFilteredData = allMonthlyData
        .filter(m => {
          const monthStart = new Date(m.monthDate.getFullYear(), m.monthDate.getMonth(), 1);
          const monthEnd = new Date(m.monthDate.getFullYear(), m.monthDate.getMonth() + 1, 0, 23, 59, 59);
          return monthStart <= toDate && monthEnd >= fromDate;
        })
        .sort((a, b) => a.monthDate.getTime() - b.monthDate.getTime());

      const isLongDuration = rawFilteredData.length > 12;
      let finalChartData;

      if (isLongDuration) {
        const yearlyMap = new Map<number, { year: number; income: number; expenses: number; savings: number; }>();

        rawFilteredData.forEach(m => {
          const year = m.monthDate.getFullYear();
          if (!yearlyMap.has(year)) {
            yearlyMap.set(year, { year, income: 0, expenses: 0, savings: 0 });
          }
          const current = yearlyMap.get(year)!;
          current.income += (m.income || 0);
          current.expenses += (m.expenses || 0);
          current.savings += (m.savings || 0);
        });

        finalChartData = Array.from(yearlyMap.values())
          .sort((a, b) => a.year - b.year)
          .map(y => ({
            month: y.year.toString(),
            income: y.income,
            expenses: y.expenses,
            savings: y.savings,
          }));

      } else {
        const uniqueYears = new Set(rawFilteredData.map(m => m.monthDate.getFullYear()));
        const showYearInLabel = uniqueYears.size > 1;

        finalChartData = rawFilteredData.map(m => {
          let label = m.month;
           if (showYearInLabel) {
             const shortYear = m.monthDate.getFullYear().toString().slice(2);
             label = `${m.month} '${shortYear}`;
           }

           return {
            month: label,
            income: m.income,
            expenses: m.expenses,
            savings: m.savings,
          };
        });
      }



      setMonthlyData(finalChartData);
      
      // Calculate totals from more precise sources
      
      // 1. Income: Calculate from transactions (which are fetched with exact date range)
      // We use transactions for income because usually there are fewer income entries than expenses,
      // so the 1000 limit is less likely to be hit.
      // Also, category reports typically don't include income.
      let preciseTotalIncome = 0;
      let txData: any[] = [];
      
      if (Array.isArray(transactionsResponse)) {
        txData = transactionsResponse;
      } else if (transactionsResponse?.data && Array.isArray(transactionsResponse.data)) {
        txData = transactionsResponse.data;
      } else if (transactionsResponse?.transactions && Array.isArray(transactionsResponse.transactions)) {
        txData = transactionsResponse.transactions;
      }

      if (txData.length > 0) {
        preciseTotalIncome = txData
          .filter((t: any) => t.type === 'income')
          .reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0);
      }

      // 2. Expenses: Use category report total (backend aggregated, exact dates)
      // This is generally more accurate for expenses than summing transactions (due to pagination limits)
      // and definitely more accurate than monthly reports (which are whole-month only)
      // When selectedCurrency is 'ALL', we need to sum all category expenses regardless of currency
      // When a specific currency is selected, only sum expenses in that currency
      let preciseTotalExpenses = 0;
      if (selectedCurrency === 'ALL') {
        // Sum all expenses from all categories (all currencies)
        preciseTotalExpenses = processedCategoryData.reduce((sum: number, cat: CategoryData) => sum + cat.value, 0);
      } else {
        // Sum only expenses in the selected currency
        preciseTotalExpenses = calculatedTotalExpensesFromCategories;
      }
      
      // 3. Savings
      const preciseTotalSavings = preciseTotalIncome - preciseTotalExpenses;

      setTotalIncome(preciseTotalIncome);
      setTotalExpenses(preciseTotalExpenses);
      setTotalSavings(preciseTotalSavings);

      // --- Process Transactions ---
      try {
        let formattedTransactions = txData.map((t: any) => ({
          ...t,
          description: t.notes || t.description || '',
          date: formatDateForDisplayUtil(t.date || new Date().toISOString().split('T')[0], i18n.language),
        }));
        
        if (apiCurrencyFilter && apiCurrencyFilter !== 'ALL') {
          formattedTransactions = formattedTransactions.filter((t: any) => 
            t.currency && t.currency.toUpperCase() === apiCurrencyFilter.toUpperCase()
          );
        }
        setTransactions(formattedTransactions);
      } catch (error) {
        console.error('Error processing transactions:', error);
        setTransactions([]);
      }

      // --- Process Investments ---
      try {
        let formattedInvestments = (investmentsResponse.data || []).map((inv: any) => {
          const investedAmount = inv.investedAmount ?? inv.invested_amount ?? 0;
          const currentValue = inv.currentValue ?? inv.current_value ?? 0;
          const investedAmountNum = typeof investedAmount === 'string' ? parseFloat(investedAmount) : investedAmount;
          const currentValueNum = typeof currentValue === 'string' ? parseFloat(currentValue) : currentValue;
          const profitLoss = currentValueNum - investedAmountNum;
          const profitLossPercent = investedAmountNum > 0 ? ((profitLoss / investedAmountNum) * 100) : 0;
          
          const categoryObj = inv.category;
          const categoryName = typeof categoryObj === 'string' 
            ? categoryObj 
            : (categoryObj?.name || inv.categoryName || '');
          
          return {
            ...inv,
            investedAmount: investedAmountNum,
            currentValue: currentValueNum,
            category: categoryName,
            profitLoss,
            profitLossPercent,
            startDate: formatDateForDisplayUtil(inv.startDate || inv.start_date || inv.date || new Date().toISOString().split('T')[0], i18n.language),
          };
        });
        
        if (apiCurrencyFilter && apiCurrencyFilter !== 'ALL') {
          formattedInvestments = formattedInvestments.filter((inv: any) => 
            inv.currency && inv.currency.toUpperCase() === apiCurrencyFilter.toUpperCase()
          );
        }
        setInvestments(formattedInvestments);
      } catch (error) {
        console.error('Error processing investments:', error);
        setInvestments([]);
      }
      
    } catch (error) {
      console.error('Error fetching reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReportsData();
    setRefreshing(false);
  };

  const getCategoryColor = (categoryName: string): string => {
    const category = allCategories.find(c => c.name === categoryName);
    if (category?.color) {
      return category.color;
    }
    
    // Fallback color palette
    const colorPalette = [
      '#4CAF50', '#FF9800', '#FF5252', '#03A9F4', '#9C27B0', '#FFC107',
      '#E91E63', '#00BCD4', '#8BC34A', '#FF7043', '#795548', '#607D8B'
    ];
    const index = categoryName.length % colorPalette.length;
    return colorPalette[index];
  };

  const getCategoryDisplayName = (name: string): string => {
    const translated = translateCategoryName(name, t);
    return translated.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const getLocaleForLanguage = (lang?: string): string => {
    if (!lang) return 'en-US';
    const localeMap: { [key: string]: string } = {
      'en': 'en-US', 'es': 'es-ES', 'zh-CN': 'zh-CN', 'hi': 'hi-IN', 'ar': 'ar-SA',
      'fr': 'fr-FR', 'pt-BR': 'pt-BR', 'pt-PT': 'pt-PT', 'ru': 'ru-RU', 'ja': 'ja-JP', 'de': 'de-DE',
    };
    return localeMap[lang] || lang || 'en-US';
  };

  const getDateRangeDisplayText = useMemo(() => {
    return (value: string): string => {
      const dateRangeMap: { [key: string]: string } = {
        'currentMonth': t('reports.currentMonth'),
        'currentYear': t('reports.currentYear'),
        '1month': t('reports.lastMonth'),
        '3months': t('reports.last3Months'),
        '6months': t('reports.last6Months'),
        '1year': t('reports.lastYear'),
        'custom': t('reports.customRange'),
        'all': t('reports.allTime'),
      };
      return dateRangeMap[value] || value;
    };
  }, [t, languageKey]); // Re-create function when language changes

  const displayCurrency = selectedCurrency === 'ALL' ? currency : selectedCurrency;

  const formatValue = (value: number): string => {
    // Preserve 2 decimal places for accurate totals (e.g., 7.90 should show as 7.90, not 8)
    return value.toLocaleString(i18n.language, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDateForDisplay = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDate(selectedDate);
      const formattedDate = formatDateForAPI(selectedDate);
      setCustomDateFrom(formattedDate);
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEndDate(selectedDate);
      const formattedDate = formatDateForAPI(selectedDate);
      setCustomDateTo(formattedDate);
    }
  };

  const handleDownloadCSV = async () => {
    try {
      
      // Get date range
      let from: string, to: string;
      if (dateRange === 'custom') {
        if (!customDateFrom || !customDateTo) {
          showToast.error(
            t('reports.pleaseSelectDateRange', { defaultValue: 'Please select a date range' }),
            t('common.error', { defaultValue: 'Error' })
          );
          return;
        }
        from = customDateFrom;
        to = customDateTo;
      } else {
        const dateRangeResult = getDateRangeFromString(dateRange);
        from = dateRangeResult.from;
        to = dateRangeResult.to;
      }

      // Determine API currency filter
      const apiCurrencyFilter = selectedCurrency === 'ALL' ? undefined : selectedCurrency;

      // Call backend API to get CSV content
      const csvContent = await reportsService.exportCsv(from, to, apiCurrencyFilter, i18n.language);

      if (!csvContent) {
        throw new Error(t('reports.csvError', { defaultValue: 'Failed to generate CSV content' }));
      }

      if (Platform.OS === 'web') {
        // Web-specific download logic
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
          const fileName = `financial_report_${from}_to_${to}.csv`;
          const url = URL.createObjectURL(blob);
          link.setAttribute('href', url);
          link.setAttribute('download', fileName);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        showToast.success(
          t('reports.csvDownloaded', { defaultValue: 'CSV downloaded successfully' }),
          t('common.success', { defaultValue: 'Success' })
        );
        return;
      }

      // Native logic - try FileSystem first
      const fileName = `financial_report_${from}_to_${to}.csv`;
      
      // Try documentDirectory first, then cacheDirectory
      let fileDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
      
      if (fileDir) {
        // FileSystem is available - use it
        const fileUri = `${fileDir}${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, csvContent, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/csv',
            dialogTitle: t('reports.shareCsv', { defaultValue: 'Share CSV Report' }),
            UTI: 'public.comma-separated-values-text',
          });
        } else {
          showToast.success(
            t('reports.csvSaved', { defaultValue: 'CSV saved successfully' }),
            t('common.success', { defaultValue: 'Success' })
          );
        }
      } else {
        // Fallback: Convert CSV to HTML table and use expo-print (works like PDF)
        const lines = csvContent.split('\n');
        const htmlRows = lines.map((line, index) => {
          const cells = line.split(',').map(cell => 
            `<td style="border: 1px solid #ddd; padding: 8px;">${cell.replace(/"/g, '')}</td>`
          ).join('');
          return index === 0 
            ? `<tr style="background: #f0f0f0; font-weight: bold;">${cells}</tr>`
            : `<tr>${cells}</tr>`;
        }).join('');
        
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Financial Report</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #333; }
              table { border-collapse: collapse; width: 100%; margin-top: 20px; }
              td { font-size: 12px; }
            </style>
          </head>
          <body>
            <h1>Financial Report</h1>
            <p>Period: ${from} to ${to}</p>
            <table>${htmlRows}</table>
          </body>
          </html>
        `;

        // Use expo-print to create printable/shareable document
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: t('reports.shareCsv', { defaultValue: 'Share Report' }),
          });
        }
        showToast.success(
          t('reports.csvDownloaded', { defaultValue: 'Report generated successfully (PDF format due to development mode)' }),
          t('common.success', { defaultValue: 'Success' })
        );
      }
    } catch (error: any) {
      showToast.error(
        error.message || t('reports.csvError', { defaultValue: 'Failed to generate CSV' }),
        t('common.error', { defaultValue: 'Error' })
      );
    }
  };

  const handleDownloadPDF = async () => {
    try {
      
      // Get date range
      let from: string, to: string;
      if (dateRange === 'custom') {
        if (!customDateFrom || !customDateTo) {
          showToast.error(
            t('reports.pleaseSelectDateRange', { defaultValue: 'Please select a date range' }),
            t('common.error', { defaultValue: 'Error' })
          );
          return;
        }
        from = customDateFrom;
        to = customDateTo;
      } else {
        const dateRangeResult = getDateRangeFromString(dateRange);
        from = dateRangeResult.from;
        to = dateRangeResult.to;
      }


      // Determine API currency filter
      const apiCurrencyFilter = selectedCurrency === 'ALL' ? undefined : selectedCurrency;

      // Call backend API to get PDF HTML
      const htmlContent = await reportsService.exportPdf(from, to, apiCurrencyFilter, i18n.language);
      
      if (!Print || !Print.printToFileAsync) {
        throw new Error('Print module is not available. The app may need to be rebuilt.');
      }

      // Convert HTML to PDF using expo-print
      const { uri } = await Print.printToFileAsync({ html: htmlContent });

      const canShare = await Sharing.isAvailableAsync();
      
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: t('reports.sharePdf'),
        });
      } else {
        showToast.success(
          t('reports.pdfReadyDescription', { uri }),
          t('reports.pdfReady')
        );
      }
    } catch (error: any) {
      console.error('Failed to generate PDF export:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      showToast.error(
        error.message || t('reports.pdfError'),
        t('common.error', { defaultValue: 'Error' })
      );
    }
  };

  // Prepare chart data
  const incomeExpenseChartData = {
    labels: monthlyData.map(m => m.month),
    datasets: [
      {
        data: monthlyData.map(m => m.income),
        strokeWidth: 3,
        legend: t('dashboard.income', { defaultValue: 'Income' }),
      },
      {
        data: monthlyData.map(m => m.expenses),
        color: (opacity = 1) => `rgba(255, 82, 82, ${opacity})`,
        strokeWidth: 3,
        legend: t('dashboard.expenses', { defaultValue: 'Expenses' }),
      },
    ],
  };

  const lineChartData = {
    labels: monthlyData.map(m => m.month),
    datasets: [
      {
        data: monthlyData.map(m => m.savings),
        color: (opacity = 1) => `rgba(3, 169, 244, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  const pieChartData = categoryData.map(cat => ({
    name: cat.name,
    value: cat.value,
    color: cat.color,
    legendFontColor: isDark ? colors.foreground : '#333',
    legendFontSize: 12,
  }));

  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => isDark 
      ? `rgba(255, 255, 255, ${opacity * 0.7})` 
      : `rgba(117, 117, 117, ${opacity})`, // #757575 like Cordova
    labelColor: (opacity = 1) => isDark 
      ? `rgba(255, 255, 255, ${opacity * 0.7})` 
      : `rgba(117, 117, 117, ${opacity})`, // #757575 like Cordova
    style: {
      borderRadius: 12,
    },
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: '#03A9F4',
    },
    propsForBackgroundLines: {
      strokeDasharray: '3, 3', // Dashed grid lines like Cordova
      stroke: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e0e0e0',
    },
    propsForLabels: {
      fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
      fontSize: 9,
      fontWeight: '400',
    },
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <LoadingSpinner 
          size="large" 
          text={t('common.loading', { defaultValue: 'Loading...' })} 
          fullScreen={true}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, responsiveTextStyles.h3, { color: colors.foreground }]}>{t('reports.reportsAnalytics')}</Text>
        <Text style={[styles.headerSubtitle, responsiveTextStyles.bodySmall, { color: colors.mutedForeground }]}>{t('reports.trackFinancialTrends')}</Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable
          style={[styles.tab, activeTab === 'reports' && [styles.tabActive, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTab('reports')}
        >
          <Text style={[styles.tabText, responsiveTextStyles.body, { color: colors.mutedForeground }, activeTab === 'reports' && [styles.tabTextActive, { color: colors.primary }]]}>
            {t('reports.reports')}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'analytics' && [styles.tabActive, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTab('analytics')}
        >
          <Text style={[styles.tabText, responsiveTextStyles.body, { color: colors.mutedForeground }, activeTab === 'analytics' && [styles.tabTextActive, { color: colors.primary }]]}>
            {t('reports.analytics')}
          </Text>
        </Pressable>
      </View>

      {/* Analytics Tab Content */}
      {activeTab === 'analytics' && (
        <Analytics />
      )}

      {/* Reports Tab Content */}
      {activeTab === 'reports' && (
        <>
      {/* Filters */}
      <View style={[styles.filtersContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable
          style={[styles.filterButton, { backgroundColor: colors.muted, borderColor: colors.border }]}
          onPress={() => setShowDateRangeModal(true)}
        >
          <Calendar size={18} color={colors.mutedForeground} />
          <Text style={[styles.filterButtonText, { color: colors.foreground }]}>
            {getDateRangeDisplayText(dateRange)}
          </Text>
          <ChevronDown size={18} color={colors.mutedForeground} />
        </Pressable>
        
        <Pressable
          style={[styles.filterButton, { backgroundColor: colors.muted, borderColor: colors.border }]}
          onPress={() => setShowCurrencyModal(true)}
        >
          <DollarSign size={18} color={colors.mutedForeground} />
          <Text style={[styles.filterButtonText, { color: colors.foreground }]}>
            {selectedCurrency === 'ALL' ? t('reports.allCurrencies') : selectedCurrency}
          </Text>
          <ChevronDown size={18} color={colors.mutedForeground} />
        </Pressable>
      </View>
      
      {/* CSV/PDF Download Buttons Row */}
      <View style={[styles.downloadButtonsContainer, { backgroundColor: colors.card }]}>
        <Pressable style={[styles.downloadButton, { backgroundColor: colors.muted, borderColor: colors.border }]} onPress={handleDownloadCSV}>
          <Download size={16} color={colors.mutedForeground} />
          <Text style={[styles.downloadButtonText, { color: colors.foreground }]}>{t('reports.csv')}</Text>
        </Pressable>
        <Pressable style={[styles.downloadButton, { backgroundColor: colors.muted, borderColor: colors.border }]} onPress={handleDownloadPDF}>
          <Download size={16} color={colors.mutedForeground} />
          <Text style={[styles.downloadButtonText, { color: colors.foreground }]}>{t('reports.pdf')}</Text>
        </Pressable>
      </View>

        {/* Custom Date Range Inputs */}
        {dateRange === 'custom' && (
          <View style={[styles.customDateContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <View style={styles.customDateRow}>
            <View style={styles.customDateInputWrapper}>
              <Text style={[styles.customDateLabel, { color: colors.foreground }]}>{t('reports.startDate', { defaultValue: 'Start Date' })}</Text>
              <Pressable 
                style={[styles.customDateInput, { backgroundColor: colors.muted, borderColor: colors.border }]}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Text style={[styles.dateInputText, { color: colors.foreground }]}>
                  {customDateFrom ? formatDateForDisplayUtil(customDateFrom, i18n.language) : 'dd/mm/yyyy'}
                </Text>
                <Calendar size={18} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <View style={styles.customDateInputWrapper}>
              <Text style={[styles.customDateLabel, { color: colors.foreground }]}>{t('reports.endDate', { defaultValue: 'End Date' })}</Text>
              <Pressable 
                style={[styles.customDateInput, { backgroundColor: colors.muted, borderColor: colors.border }]}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Text style={[styles.dateInputText, { color: colors.foreground }]}>
                  {customDateTo ? formatDateForDisplayUtil(customDateTo, i18n.language) : 'dd/mm/yyyy'}
                </Text>
                <Calendar size={18} color={colors.mutedForeground} />
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Date Pickers - Wrap in Modal for iOS */}
      {showStartDatePicker && Platform.OS === 'ios' && (
        <Modal
          visible={showStartDatePicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowStartDatePicker(false)}
        >
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View style={{ backgroundColor: colors.card, paddingBottom: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Pressable onPress={() => setShowStartDatePicker(false)}>
                  <Text style={{ color: colors.mutedForeground, fontSize: 16 }}>{t('common.cancel')}</Text>
                </Pressable>
                <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: 'bold' }}>{t('reports.startDate', { defaultValue: 'Start Date' })}</Text>
                <Pressable onPress={() => setShowStartDatePicker(false)}>
                  <Text style={{ color: colors.primary, fontSize: 16, fontWeight: 'bold' }}>{t('common.done')}</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={startDate}
                mode="date"
                display="spinner"
                onChange={handleStartDateChange}
                maximumDate={endDate}
                textColor={isDark ? 'white' : 'black'}
              />
            </View>
          </View>
        </Modal>
      )}
      {showStartDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={handleStartDateChange}
          maximumDate={endDate}
        />
      )}

      {showEndDatePicker && Platform.OS === 'ios' && (
        <Modal
          visible={showEndDatePicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowEndDatePicker(false)}
        >
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View style={{ backgroundColor: colors.card, paddingBottom: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Pressable onPress={() => setShowEndDatePicker(false)}>
                  <Text style={{ color: colors.mutedForeground, fontSize: 16 }}>{t('common.cancel')}</Text>
                </Pressable>
                <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: 'bold' }}>{t('reports.endDate', { defaultValue: 'End Date' })}</Text>
                <Pressable onPress={() => setShowEndDatePicker(false)}>
                  <Text style={{ color: colors.primary, fontSize: 16, fontWeight: 'bold' }}>{t('common.done')}</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={endDate}
                mode="date"
                display="spinner"
                onChange={handleEndDateChange}
                minimumDate={startDate}
                textColor={isDark ? 'white' : 'black'}
              />
            </View>
          </View>
        </Modal>
      )}
      {showEndDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={handleEndDateChange}
          minimumDate={startDate}
        />
      )}

      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: isTablet ? 40 : 80, paddingHorizontal: isTablet ? padding : 16 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { 
            backgroundColor: isDark ? 'rgba(76, 175, 80, 0.15)' : '#E8F5E9' 
          }]}>
            <TrendingUp size={24} color="#4CAF50" />
            <Text style={[styles.summaryLabel, responsiveTextStyles.caption, { 
              color: isDark ? colors.foreground : '#666' 
            }]}>{t('reports.totalIncome')}</Text>
            <Text style={[styles.summaryValue, responsiveTextStyles.h3, { color: '#4CAF50' }]}>
              {displayCurrency} {formatValue(totalIncome)}
            </Text>
          </View>
          <View style={[styles.summaryCard, { 
            backgroundColor: isDark ? 'rgba(255, 82, 82, 0.15)' : '#FFEBEE' 
          }]}>
            <TrendingDown size={24} color="#FF5252" />
            <Text style={[styles.summaryLabel, responsiveTextStyles.caption, { 
              color: isDark ? colors.foreground : '#666' 
            }]}>{t('reports.totalExpenses')}</Text>
            <Text style={[styles.summaryValue, responsiveTextStyles.h3, { color: '#FF5252' }]}>
              {displayCurrency} {formatValue(totalExpenses)}
            </Text>
          </View>
        </View>
        
        <View style={[styles.summaryCard, styles.summaryCardFull, { 
          backgroundColor: isDark ? 'rgba(3, 169, 244, 0.15)' : '#E3F2FD' 
        }]}>
          <DollarSign size={24} color="#03A9F4" />
          <Text style={[styles.summaryLabel, responsiveTextStyles.caption, { 
            color: isDark ? colors.foreground : '#666' 
          }]}>{t('reports.netSavings')}</Text>
          <Text style={[styles.summaryValue, responsiveTextStyles.h3, { color: '#03A9F4' }]}>
            {displayCurrency} {formatValue(totalSavings)}
          </Text>
        </View>

        {/* Income vs Expenses Bar Chart */}
        {monthlyData.length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.chartTitle, responsiveTextStyles.h3, { color: colors.foreground }]}>{t('reports.incomeVsExpensesOverTime')}</Text>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
                <Text style={[styles.legendText, { color: colors.foreground }]}>{t('dashboard.income', { defaultValue: 'Income' })}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#FF5252' }]} />
                <Text style={[styles.legendText, { color: colors.foreground }]}>{t('dashboard.expenses', { defaultValue: 'Expenses' })}</Text>
              </View>
            </View>
            <LineChart
              data={incomeExpenseChartData}
              width={width - 64}
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={chartConfig}
              verticalLabelRotation={30}
              bezier
              style={styles.chart}
            />
          </View>
        )}

        {/* Savings Trend Line Chart */}
        {monthlyData.length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.chartTitle, responsiveTextStyles.h3, { color: colors.foreground }]}>{t('reports.savingsTrend')}</Text>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#03A9F4' }]} />
                <Text style={[styles.legendText, { color: colors.foreground }]}>{t('dashboard.savings', { defaultValue: 'Savings' })}</Text>
              </View>
            </View>
            <LineChart
              data={lineChartData}
              width={width - 64}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </View>
        )}

        {/* Category-wise Spending Pie Chart */}
        {categoryData.length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.chartTitle, responsiveTextStyles.h3, { color: colors.foreground }]}>{t('reports.spendingByCategory')}</Text>
            <PieChart
              data={pieChartData}
              width={width - 64}
              height={220}
              chartConfig={chartConfig}
              accessor="value"
              backgroundColor="transparent"
              paddingLeft="15"
              style={styles.chart}
            />
          </View>
        )}

        {/* Category Breakdown List */}
        {categoryData.length > 0 && (
          <View style={[styles.categoryCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.categoryTitle, responsiveTextStyles.h3, { color: colors.foreground }]}>{t('reports.categoryBreakdown')}</Text>
            {categoryData.map((cat, index) => (
              <View key={index} style={[styles.categoryItem, { borderBottomColor: colors.border }]}>
                <View style={styles.categoryItemLeft}>
                  <View style={[styles.categoryColorDot, { backgroundColor: cat.color }]} />
                  <View style={styles.categoryItemInfo}>
                    <Text style={[styles.categoryItemName, responsiveTextStyles.bodySmall, { color: colors.foreground }]}>{translateCategoryName(cat.name, t, (cat as any).original_name)}</Text>
                    <Text style={[styles.categoryItemPercentage, responsiveTextStyles.caption, { color: colors.mutedForeground }]}>
                      {cat.percentage.toFixed(1)}%
                    </Text>
                  </View>
                </View>
                <Text style={[styles.categoryItemValue, responsiveTextStyles.bodySmall, { color: colors.foreground }]}>
                  {displayCurrency} {formatValue(cat.value)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Transactions List */}
        <View style={[styles.categoryCard, { backgroundColor: colors.card }]}>
          <View style={styles.transactionsHeader}>
            <Text style={[styles.categoryTitle, responsiveTextStyles.h3, { color: colors.foreground }]}>
              {t('reports.transactions')}
            </Text>
            {transactions.length > 0 && (
              <Text style={[styles.transactionCount, { color: colors.mutedForeground }]}>
                {transactions.length} {transactions.length === 1 ? t('reports.transaction') : t('reports.transactions')}
              </Text>
            )}
          </View>
          {transactions.length > 0 ? (
            <View>
              {transactions.map((transaction) => (
                <View key={transaction.id} style={[styles.transactionItem, { borderBottomColor: colors.border }]}>
                  <View style={styles.transactionLeft}>
                    <View
                      style={[
                        styles.transactionIconContainer,
                        {
                          backgroundColor: transaction.type === 'income' 
                            ? 'rgba(76, 175, 80, 0.1)' 
                            : 'rgba(255, 82, 82, 0.1)',
                        },
                      ]}
                    >
                      {transaction.type === 'income' ? (
                        <ArrowUpRight size={20} color={colors.success} />
                      ) : (
                        <ArrowDownRight size={20} color={colors.destructive} />
                      )}
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={[styles.transactionDescription, { color: colors.foreground }]}>
                        {transaction.description || transaction.notes || t('dashboard.transactions', { defaultValue: 'Transaction' })}
                      </Text>
                      <View style={styles.transactionMeta}>
                        <Text style={[styles.transactionMetaText, { color: colors.mutedForeground }]}>
                          {translateCategoryName(transaction.category, t)}
                        </Text>
                        <Text style={[styles.transactionMetaDot, { color: colors.mutedForeground }]}>•</Text>
                        <Text style={[styles.transactionMetaText, { color: colors.mutedForeground }]}>
                          {transaction.date}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text
                      style={[
                        styles.transactionAmount,
                        { 
                          color: transaction.type === 'income' ? colors.success : colors.destructive,
                        },
                      ]}
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                      {transaction.currency || displayCurrency} {Math.abs(transaction.amount).toLocaleString(i18n.language, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, { color: colors.mutedForeground }]}>
                {t('reports.noTransactionsFound', { defaultValue: 'No transactions found' })}
              </Text>
            </View>
          )}
        </View>

        {/* Investments List */}
        <View style={[styles.categoryCard, { backgroundColor: colors.card }]}>
          <View style={styles.transactionsHeader}>
            <Text style={[styles.categoryTitle, responsiveTextStyles.h3, { color: colors.foreground }]}>
              {t('reports.investments')} ({investments.length})
            </Text>
          </View>
          {investments.length > 0 ? (
            <View>
              {investments.map((investment) => (
                <View key={investment.id} style={[styles.transactionItem, { borderBottomColor: colors.border }]}>
                  <View style={styles.transactionLeft}>
                    <View
                      style={[
                        styles.transactionIconContainer,
                        { backgroundColor: 'rgba(3, 169, 244, 0.1)' },
                      ]}
                    >
                      <Landmark size={20} color={colors.primary} />
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={[styles.transactionDescription, { color: colors.foreground }]}>
                        {investment.name || t('reports.investment')}
                      </Text>
                      <View style={styles.transactionMeta}>
                        <Text style={[styles.transactionMetaText, { color: colors.mutedForeground }]}>
                          {translateCategoryName(investment.category, t)}
                        </Text>
                        <Text style={[styles.transactionMetaDot, { color: colors.mutedForeground }]}>•</Text>
                        <Text style={[styles.transactionMetaText, { color: colors.mutedForeground }]}>
                          {investment.startDate}
                        </Text>
                        {investment.type && (
                          <>
                            <Text style={[styles.transactionMetaDot, { color: colors.mutedForeground }]}>•</Text>
                            <Text style={[styles.transactionMetaText, { color: colors.mutedForeground }]}>
                              {investment.type}
                            </Text>
                          </>
                        )}
                      </View>
                    </View>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text style={[styles.transactionAmount, { color: colors.foreground }]}>
                      {investment.currency || displayCurrency} {formatValue(investment.currentValue || 0)}
                    </Text>
                    {investment.profitLoss !== undefined && (
                      <Text
                        style={[
                          styles.investmentProfitLoss,
                          {
                            color: investment.profitLoss >= 0 ? colors.success : colors.destructive,
                          },
                        ]}
                      >
                        {investment.profitLoss >= 0 ? '+' : ''}
                        {investment.currency || displayCurrency} {formatValue(Math.abs(investment.profitLoss))}
                        {investment.profitLossPercent !== undefined && (
                          <Text style={styles.investmentProfitLossPercent}>
                            {' '}({investment.profitLossPercent >= 0 ? '+' : ''}{investment.profitLossPercent.toFixed(1)}%)
                          </Text>
                        )}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, { color: colors.mutedForeground }]}>
                {t('reports.noInvestmentsFound', { defaultValue: 'No investments found' })}
              </Text>
            </View>
          )}
        </View>

        {categoryData.length === 0 && monthlyData.length === 0 && transactions.length === 0 && investments.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: colors.mutedForeground, marginBottom: 8 }]}>
              {t('reports.noSpendingData', { defaultValue: 'No spending data available for the selected date range' })}
            </Text>
            <Text style={[styles.emptyStateText, { color: colors.mutedForeground, fontSize: 13 }]}>
              {t('reports.addTransactionsToSeeReports', { defaultValue: 'Add transactions to see your financial reports and analytics' })}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Date Range Modal */}
      <Modal
        visible={showDateRangeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDateRangeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t('reports.selectDateRange', { defaultValue: 'Select Date Range' })}</Text>
              <Pressable onPress={() => setShowDateRangeModal(false)}>
                <X size={24} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalList}>
              {['currentMonth', '1month', '3months', '6months', 'currentYear', '1year', 'custom', 'all'].map((range) => (
                <Pressable
                  key={range}
                  style={[styles.modalItem, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setDateRange(range);
                    setShowDateRangeModal(false);
                  }}
                >
                  <Text style={[styles.modalItemText, { color: colors.foreground }, dateRange === range && [styles.modalItemTextActive, { color: colors.primary }]]}>
                    {getDateRangeDisplayText(range)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Currency Modal */}
      <Modal
        visible={showCurrencyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCurrencyModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t('reports.selectCurrency', { defaultValue: 'Select Currency' })}</Text>
              <Pressable onPress={() => setShowCurrencyModal(false)}>
                <X size={24} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <View style={[styles.currencySearchContainer, { borderBottomColor: colors.border }]}>
              <TextInput
                style={[styles.currencySearchInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.foreground }]}
                placeholder={t('reports.searchCurrency', { defaultValue: 'Search currency...' })}
                placeholderTextColor={colors.mutedForeground}
                value={currencySearch}
                onChangeText={setCurrencySearch}
              />
            </View>
            <ScrollView style={styles.modalList} keyboardShouldPersistTaps="handled">
              <Pressable
                style={[styles.modalItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setSelectedCurrency('ALL');
                  setShowCurrencyModal(false);
                }}
              >
                <Text style={[styles.modalItemText, { color: colors.foreground }, selectedCurrency === 'ALL' && [styles.modalItemTextActive, { color: colors.primary }]]}>
                  {t('reports.allCurrencies')}
                </Text>
              </Pressable>
              {currencies
                .filter((curr) => {
                  if (!currencySearch.trim()) return true;
                  const q = currencySearch.toLowerCase();
                  return (
                    curr.code.toLowerCase().includes(q) ||
                    (curr.name || '').toLowerCase().includes(q)
                  );
                })
                .map((curr) => (
                  <Pressable
                    key={curr.code}
                    style={[styles.modalItem, { borderBottomColor: colors.border }]}
                    onPress={() => {
                      setSelectedCurrency(curr.code);
                      setShowCurrencyModal(false);
                    }}
                  >
                    <Text style={[styles.modalItemText, { color: colors.foreground }, selectedCurrency === curr.code && [styles.modalItemTextActive, { color: colors.primary }]]}>
                      {curr.flag ? `${curr.flag} ` : ''}{curr.code} {curr.name ? `- ${translateCurrencyName(curr.name, t, (curr as any).original_name)}` : ''}
                    </Text>
                  </Pressable>
                ))}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    ...textStyles.h3,
    marginBottom: 4,
  },
  headerSubtitle: {
    ...textStyles.caption,
    color: '#666',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#03A9F4',
  },
  tabText: {
    ...textStyles.bodySmall,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#03A9F4',
    fontWeight: '600',
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  filterButtonText: {
    flex: 1,
    ...textStyles.bodySmall,
    color: '#333',
  },
  downloadButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  downloadButtonText: {
    ...textStyles.button,
    fontWeight: '500',
    color: '#666',
  },
  customDateContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  customDateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  customDateInputWrapper: {
    flex: 1,
  },
  customDateLabel: {
    ...textStyles.label,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  customDateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
  },
  dateInputText: {
    ...textStyles.body,
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryCardFull: {
    width: '100%',
    marginBottom: 16,
  },
  summaryLabel: {
    ...textStyles.caption,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryValue: {
    ...textStyles.h3,
    fontWeight: 'bold',
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chartTitle: {
    ...textStyles.h3,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    ...textStyles.caption,
    color: '#666',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryTitle: {
    ...textStyles.h3,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryItemInfo: {
    flex: 1,
  },
  categoryItemName: {
    ...textStyles.bodySmall,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  categoryItemPercentage: {
    ...textStyles.caption,
    color: '#666',
  },
  categoryItemValue: {
    ...textStyles.bodySmall,
    fontWeight: '600',
    color: '#333',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    ...textStyles.body,
    color: '#999',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    ...textStyles.h3,
    fontWeight: 'bold',
    color: '#333',
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemText: {
    ...textStyles.body,
    color: '#333',
  },
  modalItemTextActive: {
    color: '#03A9F4',
    fontWeight: '600',
  },
  currencySearchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  currencySearchInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...textStyles.body,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  transactionCount: {
    ...textStyles.bodySmall,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    ...textStyles.bodySmall,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  transactionMetaText: {
    ...textStyles.caption,
  },
  transactionMetaDot: {
    ...textStyles.caption,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    ...textStyles.bodySmall,
    fontWeight: '600',
  },
  investmentProfitLoss: {
    ...textStyles.caption,
    marginTop: 4,
  },
  investmentProfitLossPercent: {
    ...textStyles.small,
  },
});

