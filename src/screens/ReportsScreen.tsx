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
  Alert,
  Platform,
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
import { categoriesService } from '../api/services/categories';
import { authService } from '../api/services/auth';
import { transactionsService } from '../api/services/transactions';
import { investmentsService } from '../api/services/investments';
import { getDateRangeFromString, formatDateForAPI, formatDateForDisplay as formatDateForDisplayUtil } from '../api/utils/dateUtils';
import { translateCategoryName } from '../utils/categoryTranslator';
import Analytics from '../components/Analytics';
import { useTheme } from '../contexts/ThemeContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';

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
  const [loading, setLoading] = useState(true);
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
  const [currencies, setCurrencies] = useState<Array<{ code: string; symbol: string; name?: string; flag?: string }>>([]);
  const [allCategories, setAllCategories] = useState<Array<{ name: string; color?: string | null }>>([]);
  const [currencySearch, setCurrencySearch] = useState('');

  const responsiveTextStyles = createResponsiveTextStyles(width);



  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (currency) {
      loadReportsData();
    }
  }, [dateRange, customDateFrom, customDateTo, selectedCurrency, currency]);

  const loadInitialData = async () => {
    try {
      // Get user currency
      const userData = await authService.getCurrentUser();
      const defaultCurrency = userData.defaultCurrency || 'USD';
      setCurrency(defaultCurrency);
      setSelectedCurrency(defaultCurrency);
      
      // Load currencies
      try {
        const currenciesData = await currenciesService.getCurrencies();
        setCurrencies(currenciesData);
      } catch (error) {
        console.error('Failed to load currencies:', error);
      }
      
      // Load categories
      try {
        const categoriesResponse = await categoriesService.getCategories();
        const allCats = [
          ...(categoriesResponse.system || []),
          ...(categoriesResponse.custom || []),
        ];
        setAllCategories(allCats);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
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
      
      // Fetch category report
      const categoryReport = await reportsService.getCategoryReport(from, to, apiCurrencyFilter);
      const categoryReportData = Array.isArray(categoryReport.data) ? categoryReport.data : [];
      
      // Process category data
      // Filter by currency if a specific currency is selected (not ALL)
      // When ALL is selected, the backend should return all currencies, but we need to handle it properly
      const processedCategoryData = categoryReportData
        .map((c: any) => {
          // If a specific currency is selected, only include categories in that currency
          // When ALL is selected, include all (backend should handle currency grouping)
          const categoryCurrency = c.currency || currency;
          const shouldInclude = selectedCurrency === 'ALL' || categoryCurrency === selectedCurrency;
          
          return {
            name: getCategoryDisplayName(c.category),
            value: shouldInclude ? (c.total_spent || 0) : 0,
            color: getCategoryColor(c.category),
            percentage: 0, // Will calculate after we have total
            currency: categoryCurrency,
          };
        })
        .filter(cat => cat.value > 0)
        .sort((a, b) => b.value - a.value);
      
      // Calculate total expenses from category data (only in selected currency)
      // Filter categories by selected currency to avoid mixing currencies
      const categoriesInSelectedCurrency = selectedCurrency === 'ALL' 
        ? processedCategoryData 
        : processedCategoryData.filter(cat => cat.currency === selectedCurrency);
      
      const calculatedTotalExpensesFromCategories = categoriesInSelectedCurrency.reduce((sum, cat) => sum + cat.value, 0);
      
      // Calculate percentages based on total expenses from selected currency only
      processedCategoryData.forEach(cat => {
        // Only show percentage for categories in selected currency
        const isInSelectedCurrency = selectedCurrency === 'ALL' || cat.currency === selectedCurrency;
        cat.percentage = (isInSelectedCurrency && calculatedTotalExpensesFromCategories > 0)
          ? (cat.value / calculatedTotalExpensesFromCategories) * 100 
          : 0;
      });
      
      setCategoryData(processedCategoryData);
      
      // Fetch monthly reports
      const fromDate = new Date(from + 'T00:00:00');
      const toDate = new Date(to + 'T23:59:59');
      const fromYear = fromDate.getFullYear();
      const toYear = toDate.getFullYear();
      
      const yearPromises: Promise<any>[] = [];
      for (let year = fromYear; year <= toYear; year++) {
        yearPromises.push(reportsService.getMonthlyReport(year, apiCurrencyFilter));
      }
      
      const monthlyReports = await Promise.all(yearPromises);
      
      // Combine and filter monthly data
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
      
      // Filter monthly data based on date range
      const filteredMonthlyData = allMonthlyData
        .filter(m => {
          const monthStart = new Date(m.monthDate.getFullYear(), m.monthDate.getMonth(), 1);
          const monthEnd = new Date(m.monthDate.getFullYear(), m.monthDate.getMonth() + 1, 0, 23, 59, 59);
          return monthStart <= toDate && monthEnd >= fromDate;
        })
        .sort((a, b) => a.monthDate.getTime() - b.monthDate.getTime())
        .map(m => ({
          month: m.month,
          income: m.income,
          expenses: m.expenses,
          savings: m.savings,
        }));
      
      setMonthlyData(filteredMonthlyData);
      
      // Calculate totals from monthly data
      // Use monthly report data for all totals to ensure consistency
      // The backend should filter by currency when apiCurrencyFilter is provided
      const calculatedTotalIncome = filteredMonthlyData.reduce((sum, m) => sum + (m.income || 0), 0);
      const calculatedTotalExpensesFromMonthly = filteredMonthlyData.reduce((sum, m) => sum + (m.expenses || 0), 0);
      const calculatedTotalSavings = filteredMonthlyData.reduce((sum, m) => sum + (m.savings || 0), 0);
      
      // Use monthly report expenses for total expenses (more accurate and consistent)
      // This ensures income, expenses, and savings all come from the same source
      // Fallback to category report if monthly data is empty
      const finalTotalExpenses = calculatedTotalExpensesFromMonthly > 0 
        ? calculatedTotalExpensesFromMonthly 
        : calculatedTotalExpensesFromCategories;
      
      setTotalExpenses(finalTotalExpenses);
      setTotalIncome(calculatedTotalIncome);
      setTotalSavings(calculatedTotalSavings);

      // Fetch transactions for the date range
      const transactionFilters: any = {
        from_date: from,
        to_date: to,
        per_page: 1000, // Get more transactions for reports
      };
      
      // Add currency filter if a specific currency is selected
      if (apiCurrencyFilter) {
        transactionFilters.currency = apiCurrencyFilter;
      }
      
      try {
        const transactionsResponse = await transactionsService.getTransactions(transactionFilters);
        
        // Format transactions
        let formattedTransactions = (transactionsResponse.data || []).map((t: any) => ({
          ...t,
          description: t.notes || t.description || '',
          date: formatDateForDisplayUtil(t.date || new Date().toISOString().split('T')[0], i18n.language),
        }));
        
        // Additional frontend filter as backup to ensure currency filtering works
        if (apiCurrencyFilter && apiCurrencyFilter !== 'ALL') {
          formattedTransactions = formattedTransactions.filter((t: any) => 
            t.currency && t.currency.toUpperCase() === apiCurrencyFilter.toUpperCase()
          );
        }
        
        setTransactions(formattedTransactions);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setTransactions([]);
      }

      // Fetch investments for the date range
      const investmentFilters: any = {
        date_from: from,
        date_to: to,
        per_page: 1000, // Get more investments for reports
      };
      
      // Add currency filter if a specific currency is selected
      if (apiCurrencyFilter) {
        investmentFilters.currency = apiCurrencyFilter;
      }
      
      try {
        const investmentsResponse = await investmentsService.getInvestments(investmentFilters);
        
        // Format investments
        let formattedInvestments = (investmentsResponse.data || []).map((inv: any) => {
          const investedAmount = inv.investedAmount ?? inv.invested_amount ?? 0;
          const currentValue = inv.currentValue ?? inv.current_value ?? 0;
          const investedAmountNum = typeof investedAmount === 'string' ? parseFloat(investedAmount) : investedAmount;
          const currentValueNum = typeof currentValue === 'string' ? parseFloat(currentValue) : currentValue;
          const profitLoss = currentValueNum - investedAmountNum;
          const profitLossPercent = investedAmountNum > 0 ? ((profitLoss / investedAmountNum) * 100) : 0;
          
          // Extract category name string from category object or string
          const categoryObj = inv.category;
          const categoryName = typeof categoryObj === 'string' 
            ? categoryObj 
            : (categoryObj?.name || inv.categoryName || '');
          
          return {
            ...inv,
            investedAmount: investedAmountNum,
            currentValue: currentValueNum,
            category: categoryName, // Store as string for translateCategoryName
            profitLoss,
            profitLossPercent,
            startDate: formatDateForDisplayUtil(inv.startDate || inv.start_date || inv.date || new Date().toISOString().split('T')[0], i18n.language),
          };
        });
        
        // Additional frontend filter as backup to ensure currency filtering works
        if (apiCurrencyFilter && apiCurrencyFilter !== 'ALL') {
          formattedInvestments = formattedInvestments.filter((inv: any) => 
            inv.currency && inv.currency.toUpperCase() === apiCurrencyFilter.toUpperCase()
          );
        }
        
        setInvestments(formattedInvestments);
      } catch (error) {
        console.error('Error fetching investments:', error);
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

  const getDateRangeDisplayText = (value: string): string => {
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

  const displayCurrency = selectedCurrency === 'ALL' ? currency : selectedCurrency;

  const formatValue = (value: number): string => {
    // Match Cordova: whole numbers for report amounts
    return value.toLocaleString(i18n.language, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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
      console.log('Starting CSV download...');
      
      // Get date range
      let from: string, to: string;
      if (dateRange === 'custom') {
        if (!customDateFrom || !customDateTo) {
          Alert.alert(
            t('common.error') || 'Error',
            t('reports.selectDateRange') || 'Please select a date range'
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

      console.log('Date range:', { from, to });

      // Determine API currency filter
      const apiCurrencyFilter = selectedCurrency === 'ALL' ? undefined : selectedCurrency;

      console.log('Fetching CSV from API...');
      // Call backend API to get CSV content
      const csvContent = await reportsService.exportCsv(from, to, apiCurrencyFilter);
      console.log('CSV content received, length:', csvContent?.length);

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
        return;
      }

      // Native logic - save to file and share
      console.log('FileSystem available:', !!FileSystem);
      console.log('Sharing available:', !!Sharing);
      
      // Check execution environment
      const executionEnvironment = Constants.executionEnvironment;
      const isExpoGo = executionEnvironment === Constants.ExecutionEnvironment.StoreClient;
      console.log('Execution environment:', executionEnvironment, 'Is Expo Go:', isExpoGo);

      // Use documentDirectory for persistent, shareable files
      // Check both properties directly (they're synchronous properties in expo-file-system)
      // Note: These can be null in development builds if native module isn't linked
      let documentDir: string | null = null;
      let cacheDir: string | null = null;
      
      try {
        // Access FileSystem properties - they should be available in development builds
        documentDir = FileSystem.documentDirectory;
        cacheDir = FileSystem.cacheDirectory;
        
        // Additional check: try to verify FileSystem is working by checking if we can access bundleDirectory
        const bundleDir = FileSystem.bundleDirectory;
        console.log('bundleDirectory (check):', bundleDir);
      } catch (error: any) {
        console.error('Error accessing FileSystem directories:', error);
      }
      
      console.log('documentDirectory:', documentDir);
      console.log('cacheDirectory:', cacheDir);
      console.log('Platform:', Platform.OS);
      console.log('FileSystem object:', Object.keys(FileSystem).slice(0, 10));
      
      // Prefer documentDirectory as it's persistent and shareable
      const targetDir = documentDir || cacheDir;
      
      if (!targetDir) {
        // Provide specific error message based on environment
        let errorMessage = 'FileSystem directories are not available. ';
        
        if (isExpoGo) {
          errorMessage += '\n\nexpo-file-system is not supported in Expo Go. ';
          errorMessage += '\n\nPlease create a development build:\n';
          errorMessage += 'eas build --profile development --platform ios (or android)';
        } else {
          errorMessage += '\n\nThe native module may not be properly linked. ';
          errorMessage += '\n\nPlease rebuild your app:\n\n';
          if (Platform.OS === 'ios') {
            errorMessage += 'cd ios && pod install && cd ..\n';
            errorMessage += 'npx expo run:ios\n\n';
          } else {
            errorMessage += 'npx expo run:android\n\n';
          }
          errorMessage += 'Or create a development build:\n';
          errorMessage += 'eas build --profile development --platform ios/android';
        }
        
        Alert.alert(
          t('common.error') || 'Error',
          errorMessage,
          [
            {
              text: 'OK',
              style: 'default',
            },
          ]
        );
        
        throw new Error('FileSystem directories are not available');
      }

      // Ensure directory path ends with a slash
      const dirPath = targetDir.endsWith('/') ? targetDir : `${targetDir}/`;
      const fileName = `financial_report_${from}_to_${to}.csv`;
      const fileUri = `${dirPath}${fileName}`;
      
      console.log('Writing to:', fileUri);

      // Verify directory exists or create it
      try {
        const dirInfo = await FileSystem.getInfoAsync(dirPath);
        if (!dirInfo.exists) {
          console.log('Creating directory:', dirPath);
          await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
        }
      } catch (dirError) {
        console.warn('Directory check/create warning:', dirError);
        // Continue anyway - writeAsStringAsync will create directories if needed
      }

      // Write the file
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      console.log('File written successfully');

      // Verify file was written
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new Error('File was not created successfully');
      }
      console.log('File verified, size:', fileInfo.size, 'bytes');

      const canShare = await Sharing.isAvailableAsync();
      console.log('Can share:', canShare);
      
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: t('reports.shareCsv') || 'Share CSV report',
        });
        console.log('Share dialog opened');
      } else {
        Alert.alert(
          t('reports.csvReady') || 'CSV Ready',
          t('reports.csvReadyDescription') || `CSV file has been generated at: ${fileUri}`,
        );
      }
    } catch (error: any) {
      console.error('Failed to generate CSV export:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      Alert.alert(
        t('common.error') || 'Error',
        error.message || t('reports.csvError') || 'Failed to generate CSV report.',
      );
    }
  };

  const handleDownloadPDF = async () => {
    try {
      console.log('Starting PDF download...');
      
      // Get date range
      let from: string, to: string;
      if (dateRange === 'custom') {
        if (!customDateFrom || !customDateTo) {
          Alert.alert(
            t('common.error') || 'Error',
            t('reports.selectDateRange') || 'Please select a date range'
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

      console.log('Date range:', { from, to });

      // Determine API currency filter
      const apiCurrencyFilter = selectedCurrency === 'ALL' ? undefined : selectedCurrency;

      console.log('Fetching PDF HTML from API...');
      // Call backend API to get PDF HTML
      const htmlContent = await reportsService.exportPdf(from, to, apiCurrencyFilter);
      console.log('HTML content received, length:', htmlContent?.length);
      
      console.log('Print module available:', !!Print);
      if (!Print || !Print.printToFileAsync) {
        throw new Error('Print module is not available. The app may need to be rebuilt.');
      }

      console.log('Converting HTML to PDF...');
      // Convert HTML to PDF using expo-print
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      console.log('PDF generated at:', uri);

      const canShare = await Sharing.isAvailableAsync();
      console.log('Can share:', canShare);
      
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: t('reports.sharePdf') || 'Share PDF report',
        });
        console.log('Share dialog opened');
      } else {
        Alert.alert(
          t('reports.pdfReady') || 'PDF Ready',
          t('reports.pdfReadyDescription') || `PDF file has been generated at: ${uri}`,
        );
      }
    } catch (error: any) {
      console.error('Failed to generate PDF export:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      Alert.alert(
        t('common.error') || 'Error',
        error.message || t('reports.pdfError') || 'Failed to generate PDF report.',
      );
    }
  };

  // Prepare chart data
  const barChartData = {
    labels: monthlyData.map(m => m.month),
    datasets: [
      {
        data: monthlyData.map(m => m.income),
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
      },
      {
        data: monthlyData.map(m => m.expenses),
        color: (opacity = 1) => `rgba(255, 82, 82, ${opacity})`,
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
          text={t('common.loading') || 'Loading...'} 
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
        <Text style={[styles.headerTitle, responsiveTextStyles.h3, { color: colors.foreground }]}>{t('reports.reportsAnalytics') || 'Reports & Analytics'}</Text>
        <Text style={[styles.headerSubtitle, responsiveTextStyles.bodySmall, { color: colors.mutedForeground }]}>{t('reports.trackFinancialTrends') || 'Track your financial trends'}</Text>
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
            {selectedCurrency === 'ALL' ? t('reports.allCurrencies') || 'All Currencies' : selectedCurrency}
          </Text>
          <ChevronDown size={18} color={colors.mutedForeground} />
        </Pressable>
      </View>
      
      {/* CSV/PDF Download Buttons Row */}
      <View style={[styles.downloadButtonsContainer, { backgroundColor: colors.card }]}>
        <Pressable style={[styles.downloadButton, { backgroundColor: colors.muted, borderColor: colors.border }]} onPress={handleDownloadCSV}>
          <Download size={16} color={colors.mutedForeground} />
          <Text style={[styles.downloadButtonText, { color: colors.foreground }]}>CSV</Text>
        </Pressable>
        <Pressable style={[styles.downloadButton, { backgroundColor: colors.muted, borderColor: colors.border }]} onPress={handleDownloadPDF}>
          <Download size={16} color={colors.mutedForeground} />
          <Text style={[styles.downloadButtonText, { color: colors.foreground }]}>PDF</Text>
        </Pressable>
      </View>

        {/* Custom Date Range Inputs */}
        {dateRange === 'custom' && (
          <View style={[styles.customDateContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <View style={styles.customDateRow}>
            <View style={styles.customDateInputWrapper}>
              <Text style={[styles.customDateLabel, { color: colors.foreground }]}>{t('reports.startDate') || 'Start Date'}</Text>
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
              <Text style={[styles.customDateLabel, { color: colors.foreground }]}>{t('reports.endDate') || 'End Date'}</Text>
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

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleStartDateChange}
          maximumDate={endDate}
        />
      )}
      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleEndDateChange}
          minimumDate={startDate}
        />
      )}

      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 80 }]}
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
                <Text style={[styles.legendText, { color: colors.foreground }]}>{t('dashboard.income') || 'Income'}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#FF5252' }]} />
                <Text style={[styles.legendText, { color: colors.foreground }]}>{t('dashboard.expenses') || 'Expenses'}</Text>
              </View>
            </View>
            <BarChart
              data={barChartData}
              width={width - 64}
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={chartConfig}
              verticalLabelRotation={30}
              showValuesOnTopOfBars
              fromZero
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
                <Text style={[styles.legendText, { color: colors.foreground }]}>{t('dashboard.savings') || 'Savings'}</Text>
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
                    <Text style={[styles.categoryItemName, responsiveTextStyles.bodySmall, { color: colors.foreground }]}>{cat.name}</Text>
                    <Text style={[styles.categoryItemPercentage, responsiveTextStyles.caption, { color: colors.mutedForeground }]}>
                      {cat.percentage.toFixed(1)}%
                    </Text>
                  </View>
                </View>
                <Text style={[styles.categoryItemValue, responsiveTextStyles.bodySmall, { color: colors.foreground, fontFamily: fonts.mono }]}>
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
              {t('reports.transactions') || 'Transactions'}
            </Text>
            {transactions.length > 0 && (
              <Text style={[styles.transactionCount, { color: colors.mutedForeground }]}>
                {transactions.length} {transactions.length === 1 ? 'transaction' : 'transactions'}
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
                        {transaction.description || transaction.notes || 'Transaction'}
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
                          fontFamily: fonts.mono,
                        },
                      ]}
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                      {transaction.currency || displayCurrency} {formatValue(Math.abs(transaction.amount))}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, { color: colors.mutedForeground }]}>
                {t('reports.noTransactionsFound') || 'No transactions found'}
              </Text>
            </View>
          )}
        </View>

        {/* Investments List */}
        <View style={[styles.categoryCard, { backgroundColor: colors.card }]}>
          <View style={styles.transactionsHeader}>
            <Text style={[styles.categoryTitle, responsiveTextStyles.h3, { color: colors.foreground }]}>
              {t('reports.investments') || 'Investments'} ({investments.length})
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
                    <Text style={[styles.transactionAmount, { color: colors.foreground, fontFamily: fonts.mono }]}>
                      {investment.currency || displayCurrency} {formatValue(investment.currentValue || 0)}
                    </Text>
                    {investment.profitLoss !== undefined && (
                      <Text
                        style={[
                          styles.investmentProfitLoss,
                          {
                            color: investment.profitLoss >= 0 ? colors.success : colors.destructive,
                            fontFamily: fonts.mono,
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
                {t('reports.noInvestmentsFound') || 'No investments found'}
              </Text>
            </View>
          )}
        </View>

        {categoryData.length === 0 && monthlyData.length === 0 && transactions.length === 0 && investments.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: colors.mutedForeground }]}>
              {t('reports.noSpendingData') || 'No spending data available for the selected date range'}
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
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t('reports.selectDateRange') || 'Select Date Range'}</Text>
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
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t('reports.selectCurrency') || 'Select Currency'}</Text>
              <Pressable onPress={() => setShowCurrencyModal(false)}>
                <X size={24} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalList}>
              <View style={[styles.currencySearchContainer, { borderBottomColor: colors.border }]}>
                <TextInput
                  style={[styles.currencySearchInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.foreground }]}
                  placeholder={t('reports.searchCurrency') || 'Search currency...'}
                  placeholderTextColor={colors.mutedForeground}
                  value={currencySearch}
                  onChangeText={setCurrencySearch}
                />
              </View>
              <Pressable
                style={[styles.modalItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setSelectedCurrency('ALL');
                  setShowCurrencyModal(false);
                }}
              >
                <Text style={[styles.modalItemText, { color: colors.foreground }, selectedCurrency === 'ALL' && [styles.modalItemTextActive, { color: colors.primary }]]}>
                  {t('reports.allCurrencies') || 'All Currencies'}
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
                      {curr.flag ? `${curr.flag} ` : ''}{curr.code} {curr.name ? `- ${curr.name}` : ''}
                    </Text>
                  </Pressable>
                ))}
            </ScrollView>
          </View>
        </View>
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
    fontFamily: fonts.mono,
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
    fontFamily: fonts.mono,
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

