import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  RefreshControl,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  Edit2,
  Trash2,
  Filter,
  Search,
  X,
  Calendar,
} from 'lucide-react-native';
import { transactionsService } from '../api/services/transactions';
import { categoriesService } from '../api/services/categories';
import { authService } from '../api/services/auth';
import { currenciesService } from '../api/services/currencies';
import { formatDateForDisplay } from '../api/utils/dateUtils';
import EditTransactionScreen from './EditTransactionScreen';
import { useTheme } from '../contexts/ThemeContext';
import { fonts, createResponsiveTextStyles, textStyles } from '../constants/fonts';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { showToast } from '../utils/toast';
import { translateCategoryName } from '../utils/categoryTranslator';
import { translateCurrencyName } from '../utils/currencyTranslator';
import { useCategories } from '../hooks/useCategories';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  category: string; // Translated category name from backend
  original_category?: string; // Original English category name (for filtering/matching)
  description: string;
  date: string;
  convertedAmount?: number;
  defaultCurrency?: string;
  showConversion?: boolean;
  notes?: string;
  is_recurring?: boolean;
  recurring_frequency?: string | null;
  reminder_days?: number | null;
}

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'both';
}

interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export default function AllTransactionsScreen({ onBack }: { onBack: () => void }) {
  const { t, i18n } = useTranslation('common');
  const { width } = useWindowDimensions();
  const { isDark, colors } = useTheme();
  const responsiveTextStyles = createResponsiveTextStyles(width);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [currency, setCurrency] = useState('USD');
  const [defaultCurrency, setDefaultCurrency] = useState('USD');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDateRange, setFilterDateRange] = useState<'all' | 'this_month' | 'last_month' | 'this_year' | 'custom'>('this_month');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  
  // Use useCategories hook for automatic refetch on language change
  const { categories: categoriesData } = useCategories();
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  
  // Sync categories from hook to local state (transform to match expected format)
  useEffect(() => {
    if (categoriesData && categoriesData.length > 0) {
      setCategories(categoriesData.map((cat: any) => ({
        id: String(cat.id || cat.name),
        name: cat.name,
        type: cat.type || 'both',
      })));
    }
  }, [categoriesData]);
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(new Date());
  const [customEndDate, setCustomEndDate] = useState(new Date());
  const [pickingDateType, setPickingDateType] = useState<'start' | 'end'>('start');
  
  // Currency Filter
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [filterCurrency, setFilterCurrency] = useState('all');
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [i18n.language]);

  useEffect(() => {
    applyFilters();
  }, [transactions, searchQuery, filterType, filterCategory, filterDateRange, filterCurrency, customDateFrom, customDateTo]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get user currency
      const userData = await authService.getCurrentUser();
      const userDefaultCurrency = userData.defaultCurrency || 'USD';
      setCurrency(userDefaultCurrency);
      setDefaultCurrency(userDefaultCurrency);
      setFilterCurrency(userDefaultCurrency); // Default filter to user's default currency

      // Load currencies
      const currenciesData = await currenciesService.getCurrencies();
      setCurrencies(currenciesData);
      
      // Categories are now loaded via useCategories hook, skip manual loading
      
      // Load transactions
      await loadTransactions();
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      // Fetch currencies for currency conversion
      const currencies: Currency[] = await currenciesService.getCurrencies();
      const currencyMap = new Map(currencies.map(c => {
        const rate = (c as any).exchangeRate ?? (c as any).exchange_rate ?? 1.0;
        if (rate === null || rate === undefined || !isFinite(rate) || rate < 0) {
          console.warn(`Invalid exchange rate for ${c.code}: ${rate}, using 1.0`);
          return [c.code, 1.0];
        }
        return [c.code, rate];
      }));

      // Get user's default currency
      const userData = await authService.getCurrentUser();
      const userDefaultCurrency = userData.defaultCurrency || 'USD';
      const targetCurrency = userDefaultCurrency;
      setDefaultCurrency(targetCurrency);

      // Ensure target currency exists in currencyMap
      if (!currencyMap.has(targetCurrency)) {
        console.warn(`Target currency ${targetCurrency} not found in currencyMap, adding with rate 1.0`);
        currencyMap.set(targetCurrency, 1.0);
      }

      // Helper for conversion
      const convertToDefault = (amount: number, fromCurrency: string): number => {
        if (fromCurrency === targetCurrency) return amount;
        
        const fromRate = currencyMap.get(fromCurrency);
        const toRate = currencyMap.get(targetCurrency);
        
        if (fromRate === undefined || toRate === undefined || fromRate <= 0 || toRate <= 0 || !isFinite(fromRate) || !isFinite(toRate)) {
          console.warn(`Currency conversion: Invalid or missing rate for ${fromCurrency} (rate: ${fromRate}) or ${targetCurrency} (rate: ${toRate})`);
          return amount;
        }
        
        const converted = (amount / fromRate) * toRate;
        return isFinite(converted) ? converted : amount;
      };

      // Don't apply filters to API call initially - get all transactions and filter client-side
      // This ensures we have data to work with
      const filters: any = {
        per_page: 1000, // Get all transactions
        sort: '-date',
      };
      
      // Only apply date range filter to API (this is expensive to filter client-side)
      if (filterDateRange !== 'all') {
        const now = new Date();
        let fromDate = new Date();
        
        if (filterDateRange === 'this_month') {
          fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
          filters.from_date = fromDate.toISOString().split('T')[0];
        } else if (filterDateRange === 'last_month') {
          fromDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const toDate = new Date(now.getFullYear(), now.getMonth(), 0);
          filters.from_date = fromDate.toISOString().split('T')[0];
          filters.to_date = toDate.toISOString().split('T')[0];
        } else if (filterDateRange === 'this_year') {
          fromDate = new Date(now.getFullYear(), 0, 1);
          filters.from_date = fromDate.toISOString().split('T')[0];
        } else if (filterDateRange === 'custom' && customDateFrom && customDateTo) {
          filters.from_date = customDateFrom;
          filters.to_date = customDateTo;
        }
      }
      
      console.log('Loading transactions with filters:', filters);
      const response: any = await transactionsService.getTransactions(filters);
      console.log('Transactions response:', JSON.stringify(response, null, 2));
      
      // Handle different response structures
      let transactionsData: any[] = [];
      if (response) {
        if (Array.isArray(response)) {
          transactionsData = response;
        } else if (response.data && Array.isArray(response.data)) {
          transactionsData = response.data;
        } else if (response.transactions && Array.isArray(response.transactions)) {
          transactionsData = response.transactions;
        }
      }
      
      const formattedTransactions = transactionsData.map((tx: any) => {
        const dateStr = tx.date || tx.created_at || tx.createdAt || new Date().toISOString();
        const amount = Math.abs(tx.amount || 0);
        const txCurrency = tx.currency || defaultCurrency;
        const isDefaultCurrency = txCurrency === targetCurrency;

        let convertedAmount: number;
        // Prefer backend-provided converted amount if present
        if (typeof tx.base_amount === 'number' && tx.base_amount !== 0) {
          convertedAmount = tx.base_amount;
        } else if (typeof tx.baseAmount === 'number' && tx.baseAmount !== 0) {
          convertedAmount = tx.baseAmount;
        } else {
          // Calculate conversion if not default currency
          convertedAmount = isDefaultCurrency ? amount : convertToDefault(amount, txCurrency);
        }

        return {
          id: String(tx.id),
          type: tx.type as 'income' | 'expense',
          amount,
          currency: txCurrency,
          category: tx.category || tx.original_category || t('categories.others', { defaultValue: 'Uncategorized' }), // Use translated category from backend
          original_category: tx.original_category, // Keep original for filtering/matching
          description: tx.notes || tx.description || t('dashboard.transactions', { defaultValue: 'Transaction' }),
          date: formatDateForDisplay(dateStr, i18n.language),
          convertedAmount,
          defaultCurrency: targetCurrency,
          showConversion: !isDefaultCurrency && convertedAmount !== amount,
        };
      });
      
      console.log('Loaded transactions:', formattedTransactions.length);
      setTransactions(formattedTransactions);
      // Apply filters immediately - use the transactions we just loaded
      let filtered = [...formattedTransactions];
      
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(tx =>
          tx.description.toLowerCase().includes(query) ||
          tx.category.toLowerCase().includes(query)
        );
      }
      
      // Type filter
      if (filterType !== 'all') {
        filtered = filtered.filter(tx => tx.type === filterType);
      }
      
      // Category filter
      if (filterCategory !== 'all') {
        filtered = filtered.filter(tx => tx.category === filterCategory);
      }
      
      console.log('Setting filtered transactions:', filtered.length);
      setFilteredTransactions(filtered);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      showToast.error(t('dashboard.noTransactionsFound', { defaultValue: 'Failed to load transactions. Please try again.' }), t('common.error', { defaultValue: 'Error' }));
      setTransactions([]);
      setFilteredTransactions([]);
    }
  };

  const applyFiltersToTransactions = (txList: Transaction[]) => {
    let filtered = [...txList];
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tx =>
        tx.description.toLowerCase().includes(query) ||
        tx.category.toLowerCase().includes(query)
      );
    }
    
    // Type filter (already applied in API, but keep for consistency)
    if (filterType !== 'all') {
      filtered = filtered.filter(tx => tx.type === filterType);
    }
    
    // Category filter (already applied in API, but keep for consistency)
    if (filterCategory !== 'all') {
      filtered = filtered.filter(tx => tx.category === filterCategory);
    }

    if (filterCurrency !== 'all') {
      filtered = filtered.filter(tx => tx.currency === filterCurrency);
    }
    
    console.log('Filtered transactions:', filtered.length, 'from', txList.length);
    setFilteredTransactions(filtered);
  };

  const applyFilters = () => {
    applyFiltersToTransactions(transactions);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const handleEdit = async (transaction: Transaction) => {
    // Fetch full transaction details for editing
    try {
      const fullTransaction: any = await transactionsService.getTransaction(Number(transaction.id));
      console.log('Full transaction details:', fullTransaction);
      setEditingTransaction({
        id: fullTransaction.id.toString(),
        type: fullTransaction.type,
        amount: Math.abs(fullTransaction.amount),
        currency: fullTransaction.currency,
        category: fullTransaction.category,
        description: fullTransaction.description || fullTransaction.notes || '', // Prefer description, fallback to notes
        notes: fullTransaction.notes || '',
        date: fullTransaction.date,
        is_recurring: (fullTransaction as any).isRecurring ?? fullTransaction.is_recurring,
        recurring_frequency: (fullTransaction as any).recurringFrequency || fullTransaction.recurring_frequency,
        reminder_days: (fullTransaction as any).reminderDays ?? fullTransaction.reminder_days,
      });
    } catch (error) {
      console.error('Failed to load transaction details:', error);
      // Fallback to using the transaction we have, but ensure fields exist
      setEditingTransaction({
        ...transaction,
        description: transaction.description || '',
        notes: transaction.notes || '',
      });
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      t('dashboard.deleteTransaction', { defaultValue: 'Delete Transaction' }),
      t('dashboard.deleteTransactionConfirm', { defaultValue: 'Are you sure you want to delete this transaction?' }),
      [
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('common.delete') || 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await transactionsService.deleteTransaction(Number(id));
              showToast.success(t('dashboard.deleteTransactionSuccess') || 'Transaction deleted successfully', 'Success');
              await loadTransactions();
            } catch (error) {
              showToast.error(t('editTransaction.deleteError', { defaultValue: 'Failed to delete transaction. Please try again.' }), t('common.error', { defaultValue: 'Error' }));
            }
          },
        },
      ]
    );
  };

  const handleEditSuccess = () => {
    setEditingTransaction(null);
    loadTransactions();
  };

  const handleEditCancel = () => {
    setEditingTransaction(null);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterType('all');
    setFilterCategory('all');
    setFilterDateRange('all');
    setCustomDateFrom('');
    setCustomDateTo('');
  };

  // Calculate totals using converted amounts if available, otherwise use original amounts
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => {
      const amount = t.convertedAmount && t.showConversion ? t.convertedAmount : t.amount;
      return sum + amount;
    }, 0);
  
  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => {
      const amount = t.convertedAmount && t.showConversion ? t.convertedAmount : t.amount;
      return sum + amount;
    }, 0);

  const formatValue = (value: number): string => {
    return value.toLocaleString(i18n.language, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const hasActiveFilters = filterType !== 'all' || filterCategory !== 'all' || filterDateRange !== 'all' || searchQuery.trim() !== '';

  if (editingTransaction) {
    // Convert to Transaction type expected by EditTransactionScreen
    const transactionForEdit = {
      id: editingTransaction.id,
      type: editingTransaction.type,
      amount: editingTransaction.amount,
      currency: editingTransaction.currency,
      category: editingTransaction.category,
      notes: editingTransaction.description,
      description: editingTransaction.description,
      date: editingTransaction.date,
    } as any;
    
    return (
      <EditTransactionScreen
        transaction={transactionForEdit}
        onSuccess={handleEditSuccess}
        onCancel={handleEditCancel}
      />
    );
  }

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
        <Pressable onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, responsiveTextStyles.h3, { color: colors.foreground }]}>
            {t('dashboard.allTransactions') || 'All Transactions'}
          </Text>
          <Text style={[styles.headerSubtitle, responsiveTextStyles.caption, { color: colors.mutedForeground }]}>
            {filteredTransactions.length} {t('dashboard.totalTransactions') || 'total transactions'}
          </Text>
        </View>
      </View>

      {/* Simplified Filter Row */}
      <View style={[styles.filterRow, { backgroundColor: colors.background }]}>
        {/* Date Range Filter */}
        <Pressable 
          style={[
            styles.filterPill, 
            { backgroundColor: colors.card, borderColor: colors.border }
          ]}
          onPress={() => setShowDateRangeModal(true)}
        >
          <Calendar size={14} color={colors.foreground} />
          <Text style={[styles.filterPillText, { color: colors.foreground }]} numberOfLines={1}>
            {filterDateRange === 'all' ? (t('common.all') || 'All') :
             filterDateRange === 'this_month' ? (t('dashboard.thisMonth') || 'This Month') :
             filterDateRange === 'last_month' ? (t('dashboard.lastMonth') || 'Last Month') :
             filterDateRange === 'this_year' ? (t('dashboard.thisYear') || 'This Year') : 
             (t('dashboard.customRange') || 'Custom')}
          </Text>
        </Pressable>

        {/* Type Toggle - 3-way toggle */}
        <View style={[styles.typeToggle, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Pressable 
            style={[
              styles.typeToggleBtn,
              filterType === 'all' && { backgroundColor: colors.primary }
            ]}
            onPress={() => setFilterType('all')}
          >
            <Text style={[
              styles.typeToggleText,
              { color: filterType === 'all' ? '#fff' : colors.mutedForeground }
            ]}>
              {t('common.all') || 'All'}
            </Text>
          </Pressable>
          <Pressable 
            style={[
              styles.typeToggleBtn,
              filterType === 'income' && { backgroundColor: '#4CAF50' }
            ]}
            onPress={() => setFilterType('income')}
          >
            <ArrowUpRight size={14} color={filterType === 'income' ? '#fff' : '#4CAF50'} />
          </Pressable>
          <Pressable 
            style={[
              styles.typeToggleBtn,
              filterType === 'expense' && { backgroundColor: '#FF5252' }
            ]}
            onPress={() => setFilterType('expense')}
          >
            <ArrowDownRight size={14} color={filterType === 'expense' ? '#fff' : '#FF5252'} />
          </Pressable>
        </View>

        {/* More Filters */}
        <Pressable 
          style={[
            styles.filterPill, 
            { 
              backgroundColor: (filterCategory !== 'all' || filterCurrency !== 'all') ? colors.primary : colors.card, 
              borderColor: colors.border 
            }
          ]}
          onPress={() => setShowCategoryModal(true)}
        >
          <Filter size={14} color={(filterCategory !== 'all' || filterCurrency !== 'all') ? '#fff' : colors.foreground} />
          <Text style={[
            styles.filterPillText, 
            { color: (filterCategory !== 'all' || filterCurrency !== 'all') ? '#fff' : colors.foreground }
          ]} numberOfLines={1}>
            {(filterCategory !== 'all' || filterCurrency !== 'all') 
              ? `${filterCategory !== 'all' ? translateCategoryName(filterCategory, t) : ''}${filterCategory !== 'all' && filterCurrency !== 'all' ? ' • ' : ''}${filterCurrency !== 'all' ? filterCurrency : ''}`
              : (t('common.filter') || 'Filter')}
          </Text>
        </Pressable>
      </View>

      {/* Summary Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          {/* Total Income */}
          <View style={[styles.statsCard, { backgroundColor: isDark ? '#1E3324' : '#E8F5E9' }]}>
             <View style={{ marginBottom: 8 }}>
               <ArrowUpRight size={24} color="#4CAF50" />
             </View>
             <Text style={[styles.statsLabel, responsiveTextStyles.body, { color: isDark ? '#fff' : colors.foreground }]}>{t('dashboard.totalIncome')}</Text>
             <Text style={[styles.statsValue, responsiveTextStyles.h3, { color: '#4CAF50' }]} numberOfLines={1} adjustsFontSizeToFit>
               {defaultCurrency} {formatValue(totalIncome)}
             </Text>
          </View>

          {/* Total Expenses */}
          <View style={[styles.statsCard, { backgroundColor: isDark ? '#362020' : '#FFF5F5' }]}>
             <View style={{ marginBottom: 8 }}>
               <ArrowDownRight size={24} color="#FF5252" />
             </View>
             <Text style={[styles.statsLabel, responsiveTextStyles.body, { color: isDark ? '#fff' : colors.foreground }]}>{t('dashboard.totalExpenses')}</Text>
             <Text style={[styles.statsValue, responsiveTextStyles.h3, { color: '#FF5252' }]} numberOfLines={1} adjustsFontSizeToFit>
               {defaultCurrency} {formatValue(totalExpenses)}
             </Text>
          </View>
        </View>
      </View>

      {/* Transactions List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 80 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: colors.mutedForeground }]}>
              {loading ? t('common.loading') || 'Loading...' : t('dashboard.noTransactionsFound') || 'No transactions found'}
            </Text>
          </View>
        ) : (
          filteredTransactions.map((transaction) => (
            <Pressable
              key={transaction.id}
              onPress={() => {
                setSelectedTransactionId(selectedTransactionId === transaction.id ? null : transaction.id);
              }}
              style={[styles.transactionCard, { backgroundColor: colors.card }]}
            >
              <View style={styles.transactionContent}>
                <View
                  style={[
                    styles.transactionIcon,
                    {
                      backgroundColor:
                        transaction.type === 'income' 
                          ? (isDark ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)')
                          : (isDark ? 'rgba(255, 82, 82, 0.2)' : 'rgba(255, 82, 82, 0.1)'),
                    },
                  ]}
                >
                  {transaction.type === 'income' ? (
                    <ArrowUpRight size={20} color="#4CAF50" />
                  ) : (
                    <ArrowDownRight size={20} color="#FF5252" />
                  )}
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={[styles.transactionDescription, { color: colors.foreground }]}>
                    {transaction.description}
                  </Text>
                  <Text style={[styles.transactionMeta, responsiveTextStyles.small, { color: colors.mutedForeground }]}>
                    {translateCategoryName(transaction.category, t, transaction.original_category)} • {transaction.date}
                  </Text>
                </View>
                <View style={styles.transactionActions}>
                  <View style={styles.transactionAmountContainer}>
                  <Text
                    style={[
                      styles.transactionAmount,
                        responsiveTextStyles.body,
                      { color: transaction.type === 'income' ? '#4CAF50' : '#FF5252', fontWeight: '600' },
                  ]}
                  >
                      {transaction.type === 'income' ? '+' : '-'} {transaction.currency} {formatValue(transaction.amount)}
                  </Text>
                    {transaction.showConversion &&
                      transaction.convertedAmount !== undefined &&
                      transaction.convertedAmount !== transaction.amount && (
                        <Text
                          style={[
                            styles.conversionAmount,
                            responsiveTextStyles.small,
                            { color: colors.mutedForeground },
                          ]}
                        >
                          ≈ {transaction.defaultCurrency} {transaction.convertedAmount.toLocaleString(i18n.language, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </Text>
                      )}
                  </View>
                  {selectedTransactionId === transaction.id && (
                    <View style={styles.actionButtons}>
                      <Pressable
                        onPress={() => {
                          setSelectedTransactionId(null);
                          handleEdit(transaction);
                        }}
                        style={styles.actionButton}
                      >
                        <Edit2 size={18} color={colors.primary} />
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          setSelectedTransactionId(null);
                          handleDelete(transaction.id);
                        }}
                        style={styles.actionButton}
                      >
                        <Trash2 size={18} color="#FF5252" />
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('dashboard.selectCategory') || 'Select Category'}</Text>
              <Pressable onPress={() => setShowCategoryModal(false)}>
                <X size={24} color="#666" />
              </Pressable>
            </View>
            <ScrollView style={styles.modalList}>
              <Pressable
                style={styles.modalItem}
                onPress={() => {
                  setFilterCategory('all');
                  setShowCategoryModal(false);
                }}
              >
                <Text style={[styles.modalItemText, filterCategory === 'all' && styles.modalItemTextActive]}>
                  {t('common.all') || 'All Categories'}
                </Text>
              </Pressable>
              {categories.map((category) => (
                <Pressable
                  key={category.id}
                  style={styles.modalItem}
                  onPress={() => {
                    // Use translated category name for filtering (matches tx.category from backend)
                    setFilterCategory(category.name);
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={[styles.modalItemText, filterCategory === category.name && styles.modalItemTextActive]}>
                    {translateCategoryName(category.name, t, (category as any).original_name)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Date Range Modal */}
      <Modal
        visible={showDateRangeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDateRangeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t('dashboard.selectDateRange') || 'Select Date Range'}</Text>
              <Pressable onPress={() => setShowDateRangeModal(false)}>
                <X size={24} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalList}>
              {['all', 'this_month', 'last_month', 'this_year'].map((range) => (
                <Pressable
                  key={range}
                  style={styles.modalItem}
                  onPress={() => {
                    setFilterDateRange(range as any);
                    setShowDateRangeModal(false);
                    loadTransactions();
                  }}
                >
                  <Text style={[styles.modalItemText, { color: colors.foreground }, filterDateRange === range && styles.modalItemTextActive]}>
                    {range === 'all' 
                      ? (t('common.all') || 'All Time')
                      : range === 'this_month'
                      ? (t('dashboard.thisMonth') || 'This Month')
                      : range === 'last_month'
                      ? (t('dashboard.lastMonth') || 'Last Month')
                      : (t('dashboard.thisYear') || 'This Year')}
                  </Text>
                </Pressable>
              ))}
              
              {/* Custom Date Range Section */}
              <View style={[styles.customDateSection, { borderTopColor: colors.border }]}>
                <Text style={[styles.customDateTitle, { color: colors.foreground }]}>
                  {t('dashboard.customRange') || 'Custom Range'}
                </Text>
                <View style={styles.customDateRow}>
                  <Pressable 
                    style={[styles.datePickerButton, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
                    onPress={() => {
                      setPickingDateType('start');
                      setShowCustomDatePicker(true);
                    }}
                  >
                    <Calendar size={16} color={colors.foreground} />
                    <Text style={[styles.datePickerText, { color: colors.foreground }]}>
                      {customStartDate.toLocaleDateString(i18n.language)}
                    </Text>
                  </Pressable>
                  <Text style={{ color: colors.mutedForeground, marginHorizontal: 8 }}>→</Text>
                  <Pressable 
                    style={[styles.datePickerButton, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
                    onPress={() => {
                      setPickingDateType('end');
                      setShowCustomDatePicker(true);
                    }}
                  >
                    <Calendar size={16} color={colors.foreground} />
                    <Text style={[styles.datePickerText, { color: colors.foreground }]}>
                      {customEndDate.toLocaleDateString(i18n.language)}
                    </Text>
                  </Pressable>
                </View>
                <Pressable 
                  style={[styles.applyCustomDateBtn, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    setFilterDateRange('custom');
                    setCustomDateFrom(customStartDate.toISOString().split('T')[0]);
                    setCustomDateTo(customEndDate.toISOString().split('T')[0]);
                    setShowDateRangeModal(false);
                    loadTransactions();
                  }}
                >
                  <Text style={styles.applyCustomDateText}>
                    {t('common.apply') || 'Apply'}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* DateTimePicker for Custom Range */}
      {showCustomDatePicker && (
        <DateTimePicker
          value={pickingDateType === 'start' ? customStartDate : customEndDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowCustomDatePicker(Platform.OS === 'ios');
            if (selectedDate) {
              if (pickingDateType === 'start') {
                setCustomStartDate(selectedDate);
              } else {
                setCustomEndDate(selectedDate);
              }
            }
          }}
        />
      )}
      {/* Currency Filter Modal */}
      <Modal
        visible={showCurrencyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCurrencyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t('dashboard.selectCurrency') || 'Select Currency'}</Text>
              <Pressable onPress={() => setShowCurrencyModal(false)}>
                <X size={24} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalList}>
              <Pressable
                style={[styles.modalItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setFilterCurrency('all');
                  setShowCurrencyModal(false);
                }}
              >
                <Text style={[styles.modalItemText, { color: colors.foreground }, filterCurrency === 'all' && { color: colors.primary, fontWeight: 'bold' }]}>
                  {t('common.all') || 'All'}
                </Text>
              </Pressable>
              {currencies.map((curr) => (
                <Pressable
                  key={curr.code}
                  style={[styles.modalItem, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setFilterCurrency(curr.code);
                    setShowCurrencyModal(false);
                  }}
                >
                  <Text style={[styles.modalItemText, { color: colors.foreground }, filterCurrency === curr.code && { color: colors.primary, fontWeight: 'bold' }]}>
                    {curr.code} - {translateCurrencyName(curr.name, t, (curr as any).original_name)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    ...textStyles.h3,
  },
  headerSubtitle: {
    ...textStyles.caption,
    marginTop: 2,
  },
  filterButton: {
    padding: 8,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#03A9F4',
  },
  filterChipsContainer: {
    paddingVertical: 12,
  },
  filterChipsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: fonts.sans,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fonts.sans,
  },
  typeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  typeToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeToggleText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fonts.sans,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    ...textStyles.bodySmall,
    color: '#333',
    paddingVertical: 10,
  },
  clearButton: {
    padding: 4,
  },
  filtersPanel: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    ...textStyles.label,
    color: '#333',
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButtonItem: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#03A9F4',
  },
  filterButtonText: {
    ...textStyles.caption,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  categoryButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryButtonText: {
    ...textStyles.bodySmall,
    color: '#333',
  },
  activeFilterButton: {
    borderColor: '#03A9F4',
    backgroundColor: 'rgba(3, 169, 244, 0.05)',
  },
  statsGrid: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statsCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
  },
  statsLabel: {
    marginBottom: 8,
  },
  statsValue: {
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    ...textStyles.body,
    textAlign: 'center',
  },
  transactionCard: {
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
    // Shadow calculated in card component generally or provided here
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    ...textStyles.body,
    fontWeight: '600',
  },
  transactionMeta: {
    marginTop: 4,
  },
  transactionActions: {
    alignItems: 'flex-end',
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontWeight: '600',
  },
  conversionAmount: {
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    ...textStyles.h3,
    color: '#333',
  },
  modalList: {
    padding: 20,
  },
  modalItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemText: {
    ...textStyles.body,
    color: '#666',
  },
  modalItemTextActive: {
    color: '#03A9F4',
    fontWeight: '600',
  },
  customDateSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  customDateTitle: {
    ...textStyles.body,
    fontWeight: '600',
    marginBottom: 12,
  },
  customDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  datePickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  datePickerText: {
    ...textStyles.bodySmall,
    fontWeight: '500',
  },
  applyCustomDateBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  applyCustomDateText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
