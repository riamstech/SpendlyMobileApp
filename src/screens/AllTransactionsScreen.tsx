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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
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
import { currenciesService, Currency } from '../api/services/currencies';
import { formatDateForDisplay } from '../api/utils/dateUtils';
import EditTransactionScreen from './EditTransactionScreen';
import { useTheme } from '../contexts/ThemeContext';
import { fonts, createResponsiveTextStyles, textStyles } from '../constants/fonts';
import LoadingSpinner from '../components/ui/LoadingSpinner';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: string;
  convertedAmount?: number;
  defaultCurrency?: string;
  showConversion?: boolean;
}

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'both';
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
  const [filterDateRange, setFilterDateRange] = useState<'all' | 'this_month' | 'last_month' | 'this_year' | 'custom'>('all');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  
  // Categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, searchQuery, filterType, filterCategory, filterDateRange, customDateFrom, customDateTo]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get user currency
      const userData = await authService.getCurrentUser();
      const defaultCurrency = userData.defaultCurrency || 'USD';
      setCurrency(defaultCurrency);
      
      // Load categories first (needed for filtering)
      
      // Load categories
      try {
        const categoriesResponse = await categoriesService.getCategories();
        const allCategories = [
          ...(categoriesResponse.system || []),
          ...(categoriesResponse.custom || []),
        ];
        setCategories(allCategories.map((cat: any) => ({
          id: String(cat.id),
          name: cat.name,
          type: cat.type || 'both',
        })));
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
      
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
          category: tx.category || 'Uncategorized',
          description: tx.notes || tx.description || 'Transaction',
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
      Alert.alert('Error', 'Failed to load transactions. Please try again.');
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
        description: fullTransaction.notes || fullTransaction.description || '',
        date: fullTransaction.date,
      });
    } catch (error) {
      console.error('Failed to load transaction details:', error);
      // Fallback to using the transaction we have
      setEditingTransaction(transaction);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      t('dashboard.deleteTransaction') || 'Delete Transaction',
      t('dashboard.deleteTransactionConfirm') || 'Are you sure you want to delete this transaction?',
      [
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('common.delete') || 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await transactionsService.deleteTransaction(Number(id));
              await loadTransactions();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete transaction. Please try again.');
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

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: isDark ? 'rgba(76, 175, 80, 0.15)' : 'rgba(76, 175, 80, 0.1)' }]}>
          <Text style={[styles.summaryLabel, responsiveTextStyles.caption, { color: colors.mutedForeground }]}>
            {t('dashboard.totalIncome')}
          </Text>
          <Text style={[styles.summaryValue, responsiveTextStyles.bodySmall, { color: '#4CAF50', fontFamily: fonts.mono }]}>
            {defaultCurrency} {formatValue(totalIncome)}
          </Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: isDark ? 'rgba(255, 82, 82, 0.15)' : 'rgba(255, 82, 82, 0.1)' }]}>
          <Text style={[styles.summaryLabel, responsiveTextStyles.caption, { color: colors.mutedForeground }]}>
            {t('dashboard.totalExpenses')}
          </Text>
          <Text style={[styles.summaryValue, responsiveTextStyles.bodySmall, { color: '#FF5252', fontFamily: fonts.mono }]}>
            {defaultCurrency} {formatValue(totalExpenses)}
          </Text>
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
                  <Text style={[styles.transactionMeta, responsiveTextStyles.captionSmall, { color: colors.mutedForeground }]}>
                    {transaction.category} • {transaction.date}
                  </Text>
                </View>
                <View style={styles.transactionActions}>
                  <View style={styles.transactionAmountContainer}>
                  <Text
                    style={[
                      styles.transactionAmount,
                        responsiveTextStyles.caption,
                        { color: transaction.type === 'income' ? '#4CAF50' : '#FF5252', fontFamily: fonts.mono },
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
                            responsiveTextStyles.captionSmall,
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
                    setFilterCategory(category.id);
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={[styles.modalItemText, filterCategory === category.id && styles.modalItemTextActive]}>
                    {category.name}
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('dashboard.selectDateRange') || 'Select Date Range'}</Text>
              <Pressable onPress={() => setShowDateRangeModal(false)}>
                <X size={24} color="#666" />
              </Pressable>
            </View>
            <ScrollView style={styles.modalList}>
              {['all', 'this_month', 'last_month', 'this_year', 'custom'].map((range) => (
                <Pressable
                  key={range}
                  style={styles.modalItem}
                  onPress={() => {
                    if (range === 'custom') {
                      // For custom, we'd need a date picker - simplified for now
                      Alert.alert('Custom Date Range', 'Custom date range selection will be implemented with date picker');
                    } else {
                      setFilterDateRange(range as any);
                      setShowDateRangeModal(false);
                      loadTransactions();
                    }
                  }}
                >
                  <Text style={[styles.modalItemText, filterDateRange === range && styles.modalItemTextActive]}>
                    {range === 'all' 
                      ? (t('common.all') || 'All Time')
                      : range === 'this_month'
                      ? (t('dashboard.thisMonth') || 'This Month')
                      : range === 'last_month'
                      ? (t('dashboard.lastMonth') || 'Last Month')
                      : range === 'this_year'
                      ? (t('dashboard.thisYear') || 'This Year')
                      : range === 'custom'
                      ? (t('dashboard.customRange') || 'Custom Range')
                      : ''}
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
    fontSize: 14,
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
    fontSize: 14,
    fontWeight: '600',
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
    fontSize: 13,
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
    fontSize: 14,
    color: '#333',
  },
  clearFiltersButton: {
    marginTop: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#03A9F4',
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
  },
  summaryLabel: {
    ...textStyles.caption,
    marginBottom: 4,
  },
  summaryValue: {
    ...textStyles.bodySmall,
    fontFamily: fonts.mono,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  transactionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontFamily: fonts.header, // -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif
    fontSize: 13.76,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionMeta: {
    ...textStyles.captionSmall,
  },
  transactionActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    ...textStyles.caption,
    fontWeight: '600',
  },
  conversionAmount: {
    ...textStyles.captionSmall,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    ...textStyles.bodySmall,
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
    ...textStyles.h2,
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
  },
  modalItemTextActive: {
    color: '#03A9F4',
    fontWeight: '600',
  },
});

