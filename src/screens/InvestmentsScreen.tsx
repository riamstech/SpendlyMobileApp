import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  RefreshControl,
  Alert,
  useWindowDimensions,
  Modal,
  ActivityIndicator,
  Switch,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import DateTimePicker from '@react-native-community/datetimepicker';
import { fonts, textStyles, createResponsiveTextStyles } from '../constants/fonts';
import { useTranslation } from 'react-i18next';
import {
  Edit2,
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowLeft,
  Calendar,
  X,
  ChevronDown,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { investmentsService } from '../api/services/investments';
import { categoriesService } from '../api/services/categories';
import { currenciesService } from '../api/services/currencies';
import { authService } from '../api/services/auth';
import { translateCategoryName } from '../utils/categoryTranslator';
import { CategoryIcon } from '../components/CategoryIcon';
import { useCategories } from '../hooks/useCategories';
import { Investment } from '../api/types/investment';
import { useTheme } from '../contexts/ThemeContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string | null;
  type: 'income' | 'expense' | 'investment' | 'both';
}

export default function InvestmentsScreen() {
  const { t, i18n } = useTranslation('common');
  const { width } = useWindowDimensions();
  const { isDark, colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currency, setCurrency] = useState('USD');
  
  // Data
  const [investments, setInvestments] = useState<Investment[]>([]);
  // Use useCategories hook for automatic refetch on language change (investment type)
  const { categories: categoriesData } = useCategories('investment');
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [currencies, setCurrencies] = useState<Array<{ code: string; symbol: string; name?: string; flag?: string }>>([]);
  
  // Sync categories from hook to local state (filter for investment type)
  useEffect(() => {
    if (categoriesData && categoriesData.length > 0) {
      const investmentCats = categoriesData
        .filter((cat: any) => cat.type === 'investment' || cat.type === 'both')
        .map((cat: any) => ({
          id: String(cat.id || cat.name),
          name: cat.name,
          icon: cat.icon || 'CircleEllipsis',
          color: cat.color,
          type: cat.type || 'investment',
        }));
      setAvailableCategories(investmentCats);
    }
  }, [categoriesData]);
  
  // UI states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [deletingInvestment, setDeletingInvestment] = useState<Investment | null>(null);
  
  // Filters
  const [dateRange, setDateRange] = useState('all');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('ALL');
  
  // Date picker states
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showInvestmentDatePicker, setShowInvestmentDatePicker] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [investmentDate, setInvestmentDate] = useState(new Date());
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    type: '',
    investedAmount: '',
    currentValue: '',
    currency: currency,
    date: new Date().toISOString().split('T')[0],
    notes: '',
    isRecurring: false,
    frequency: 'monthly',
    reminderDays: '3',
  });
  
  const [showAllCategories, setShowAllCategories] = useState(false);
  
  // Modals
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showFrequencyModal, setShowFrequencyModal] = useState(false);
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [showFilterCurrencyModal, setShowFilterCurrencyModal] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');

  const responsiveTextStyles = createResponsiveTextStyles(width);
  


  const investmentTypes = [
    { key: 'long-term', label: t('investments.typeLongTerm') },
    { key: 'short-term', label: t('investments.typeShortTerm') },
    { key: 'fixed-income', label: t('investments.typeFixedIncome') },
    { key: 'growth', label: t('investments.typeGrowth') },
    { key: 'dividend', label: t('investments.typeDividend') },
  ];

  useEffect(() => {
    loadInitialData();
  }, []);

  // Reload categories and currencies when form opens
  useEffect(() => {
    if (showAddForm) {
      // Initialize investment date from formData
      if (formData.date) {
        const dateObj = new Date(formData.date + 'T00:00:00');
        if (!isNaN(dateObj.getTime())) {
          setInvestmentDate(dateObj);
        } else {
          setInvestmentDate(new Date());
        }
      } else {
        const today = new Date();
        setInvestmentDate(today);
        setFormData(prev => ({ ...prev, date: today.toISOString().split('T')[0] }));
      }
      
      const reloadData = async () => {
        try {
          // Reload currencies
          const currenciesData = await currenciesService.getCurrencies();
          setCurrencies(currenciesData);
          
          // Categories are now loaded via useCategories hook, skip manual reload
        } catch (error) {
          console.error('Failed to reload data for form:', error);
        }
      };
      reloadData();
    }
  }, [showAddForm]);

  useEffect(() => {
    if (currency) {
      loadInvestments();
    }
  }, [selectedCurrency, dateRange, customDateFrom, customDateTo]);

  // Initialize dates from custom date inputs
  useEffect(() => {
    if (customDateFrom) {
      const date = new Date(customDateFrom + 'T00:00:00');
      if (!isNaN(date.getTime())) {
        setStartDate(date);
      }
    }
  }, [customDateFrom]);

  useEffect(() => {
    if (customDateTo) {
      const date = new Date(customDateTo + 'T23:59:59');
      if (!isNaN(date.getTime())) {
        setEndDate(date);
      }
    }
  }, [customDateTo]);

  const loadInitialData = async () => {
    try {
      // Get user currency
      const userData = await authService.getCurrentUser();
      const defaultCurrency = userData.defaultCurrency || 'USD';
      setCurrency(defaultCurrency);
      setSelectedCurrency(defaultCurrency);
      setFormData(prev => ({ ...prev, currency: defaultCurrency }));
      
      // Load currencies
      try {
        const currenciesData = await currenciesService.getCurrencies();
        setCurrencies(currenciesData);
      } catch (error) {
        console.error('Failed to load currencies:', error);
      }
      
      // Categories are now loaded via useCategories hook, skip manual loading
      // The hook automatically filters for investment type
      try {
        // Categories are set via useEffect hook above
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const loadInvestments = async () => {
    try {
      setLoading(true);
      
      const filters: any = {
        currency: selectedCurrency !== 'ALL' ? selectedCurrency : undefined,
        per_page: 100,
      };

      if (dateRange !== 'all') {
        const now = new Date();
        let fromDate = new Date();
        
        if (dateRange === 'this_month') {
          fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (dateRange === 'last_month') {
          fromDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const toDate = new Date(now.getFullYear(), now.getMonth(), 0);
          filters.date_to = toDate.toISOString().split('T')[0];
        } else if (dateRange === 'this_year') {
          fromDate = new Date(now.getFullYear(), 0, 1);
        } else if (dateRange === 'custom' && customDateFrom && customDateTo) {
          filters.date_from = customDateFrom;
          filters.date_to = customDateTo;
        }

        if (dateRange !== 'custom' && dateRange !== 'all') {
          filters.date_from = fromDate.toISOString().split('T')[0];
        }
      }

      if (dateRange !== 'custom' || (customDateFrom && customDateTo)) {
        const response = await investmentsService.getInvestments(filters);
        setInvestments(response.data);
      }
    } catch (error) {
      console.error('Failed to load investments:', error);
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: t('investments.loadError')
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInvestments();
    setRefreshing(false);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.category || !formData.type || !formData.investedAmount) {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: t('investments.requiredFieldsError')
      });
      return;
    }

    const parseNumber = (value: string): number => {
      if (!value) return 0;
      const cleaned = value.replace(/[^\d.-]/g, '');
      const parsed = parseFloat(cleaned);
      if (isNaN(parsed)) return 0;
      return Math.round(parsed * 100) / 100;
    };

    const investmentData = {
      name: formData.name,
      category_id: parseInt(formData.category),
      type: formData.type,
      invested_amount: parseNumber(formData.investedAmount),
      current_value: formData.currentValue ? parseNumber(formData.currentValue) : parseNumber(formData.investedAmount),
      currency: formData.currency,
      start_date: formData.date,
      notes: formData.notes || undefined,
      recurring: formData.isRecurring,
      frequency: formData.isRecurring ? formData.frequency : undefined,
      reminder_days: formData.isRecurring ? parseInt(formData.reminderDays) : undefined,
    };

    try {
      setLoading(true);
      
      if (editingInvestment) {
        await investmentsService.updateInvestment(editingInvestment.id, investmentData);
        Toast.show({
          type: 'success',
          text1: t('common.success'),
          text2: t('investments.updateSuccess')
        });
      } else {
        await investmentsService.createInvestment(investmentData);
        Toast.show({
          type: 'success',
          text1: t('common.success'),
          text2: t('investments.createSuccess')
        });
      }
      
      await loadInvestments();
      handleCancelEdit();
    } catch (error: any) {
      console.error('Error saving investment:', error);
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: error.response?.data?.message || t('investments.saveError')
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (investment: Investment) => {
    setEditingInvestment(investment);
    const investedAmount = (investment as any).invested_amount ?? (investment as any).investedAmount ?? 0;
    const currentValue = (investment as any).current_value ?? (investment as any).currentValue ?? investedAmount;
    const investmentDateStr = investment.start_date || new Date().toISOString().split('T')[0];
    const investmentDateObj = new Date(investmentDateStr + 'T00:00:00');
    setInvestmentDate(isNaN(investmentDateObj.getTime()) ? new Date() : investmentDateObj);
    setFormData({
      name: investment.name,
      category: String(investment.category_id || investment.category?.id || ''),
      type: investment.type,
      investedAmount: String(investedAmount),
      currentValue: String(currentValue),
      currency: investment.currency,
      date: investmentDateStr,
      notes: investment.notes || '',
      isRecurring: investment.recurring || false,
      frequency: investment.frequency || 'monthly',
      reminderDays: String(investment.reminder_days || 3),
    });
    setShowAddForm(true);
  };

  const handleDelete = async () => {
    if (!deletingInvestment) return;
    
    try {
      setLoading(true);
      await investmentsService.deleteInvestment(deletingInvestment.id);
      await loadInvestments();
      setDeletingInvestment(null);
      Toast.show({
        type: 'success',
        text1: t('common.success'),
        text2: t('investments.deleteSuccess')
      });
    } catch (error: any) {
      console.error('Error deleting investment:', error);
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: error.response?.data?.message || t('investments.deleteError')
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingInvestment(null);
    setShowAddForm(false);
    const today = new Date();
    setInvestmentDate(today);
    setFormData({
      name: '',
      category: '',
      type: '',
      investedAmount: '',
      currentValue: '',
      currency: currency,
      date: today.toISOString().split('T')[0],
      notes: '',
      isRecurring: false,
      frequency: 'monthly',
      reminderDays: '3',
    });
  };

  // Calculate totals
  const totalInvested = investments.reduce((sum, inv: any) => {
    const amount = inv.invested_amount ?? inv.investedAmount ?? 0;
    return sum + (typeof amount === 'number' ? amount : parseFloat(String(amount)) || 0);
  }, 0);
  
  const totalCurrent = investments.reduce((sum, inv: any) => {
    const value = inv.current_value ?? inv.currentValue ?? 0;
    return sum + (typeof value === 'number' ? value : parseFloat(String(value)) || 0);
  }, 0);
  
  const totalGainLoss = totalCurrent - totalInvested;
  const gainLossPercentage = totalInvested > 0 ? ((totalGainLoss / totalInvested) * 100) : 0;

  // Prepare chart data
  const categoryData = availableCategories.map(cat => {
    const categoryInvestments = investments.filter(inv => inv.category_id === Number(cat.id));
    const total = categoryInvestments.reduce((sum, inv: any) => {
      const value = inv.current_value ?? inv.currentValue ?? 0;
      return sum + (typeof value === 'number' ? value : parseFloat(String(value)) || 0);
    }, 0);
    return {
      name: translateCategoryName(cat.name, t, (cat as any).original_name),
      value: total,
      color: cat.color || '#ccc',
      legendFontColor: '#333',
      legendFontSize: 12,
    };
  }).filter(item => item.value > 0);

  // Calculate monthly portfolio growth from actual backend investment data
  const monthlyData = useMemo(() => {
    if (investments.length === 0) return [];
    
    const now = new Date();
    const locale = i18n.language || 'en';
    
    // Get last 6 months
    const months: Array<{ month: string; monthDate: Date; invested: number; current: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: monthDate.toLocaleDateString(locale, { month: 'short', year: 'numeric' }),
        monthDate,
        invested: 0,
        current: 0,
      });
    }
    
    // Group investments by month based on start_date
    investments.forEach((inv: any) => {
      if (!inv.start_date) return;
      
      const startDate = new Date(inv.start_date);
      const investedAmount = inv.invested_amount ?? inv.investedAmount ?? 0;
      const currentValue = inv.current_value ?? inv.currentValue ?? investedAmount;
      
      // Find all months from investment start date to current month
      months.forEach((monthData) => {
        if (startDate <= monthData.monthDate) {
          monthData.invested += typeof investedAmount === 'number' ? investedAmount : parseFloat(String(investedAmount)) || 0;
          monthData.current += typeof currentValue === 'number' ? currentValue : parseFloat(String(currentValue)) || 0;
        }
      });
    });
    
    return months.map(m => ({
      month: m.month,
      invested: m.invested,
      current: m.current,
    }));
  }, [i18n.language, investments]);

  const formatValue = (value: number): string => {
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

  const getCurrencySymbol = (currencyCode: string): string => {
    const curr = currencies.find(c => c.code === currencyCode);
    return curr?.symbol || currencyCode;
  };

  const displayCurrency = selectedCurrency !== 'ALL' ? selectedCurrency : currency;

  // Show Add/Edit Form
  if (showAddForm) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        
        {/* Header */}
        <View style={[styles.formHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Pressable onPress={handleCancelEdit} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.formHeaderTitle, { color: colors.foreground }]}>
            {editingInvestment ? t('investments.editInvestment') : t('investments.addInvestment')}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={[styles.scrollView, { backgroundColor: colors.background }]}
          contentContainerStyle={styles.formScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Name */}
          <View style={styles.formSection}>
            <Text style={[styles.formLabel, { color: colors.foreground }]}>{t('investments.name')}</Text>
            <TextInput
              style={[styles.formInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.foreground }]}
              placeholder={t('investments.namePlaceholder')}
              placeholderTextColor={colors.mutedForeground}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
          </View>

          {/* Type and Date */}
          <View style={styles.formRow}>
            <View style={[styles.formSection, { flex: 1, marginRight: 8 }]}>
              <Text style={[styles.formLabel, { color: colors.foreground }]}>{t('investments.type')}</Text>
              <Pressable
                style={[styles.selectButton, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
                onPress={() => setShowTypeModal(true)}
              >
                <Text style={[styles.selectButtonText, { color: colors.foreground }, !formData.type && { color: colors.mutedForeground }]}>
                  {formData.type
                    ? investmentTypes.find(t => t.key === formData.type)?.label || formData.type
                    : t('investments.selectType')}
                </Text>
                <ChevronDown size={18} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <View style={[styles.formSection, { flex: 1, marginLeft: 8 }]}>
              <Text style={[styles.formLabel, { color: colors.foreground }]}>{t('addTransaction.date')}</Text>
              <Pressable
                style={[styles.selectButton, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
                onPress={() => setShowInvestmentDatePicker(true)}
              >
                <Text style={[styles.selectButtonText, { color: colors.foreground }]}>
                  {formData.date ? formatDateForDisplay(investmentDate) : t('investments.datePlaceholder')}
                </Text>
                <Calendar size={18} color={colors.mutedForeground} />
              </Pressable>
            </View>
          </View>

          {/* Category */}
          <View style={styles.formSection}>
            <Text style={[styles.formLabel, { color: colors.foreground }]}>{t('addTransaction.category')}</Text>
            {availableCategories.length === 0 ? (
              <View style={styles.emptyCategories}>
                <Text style={[styles.emptyCategoriesText, { color: colors.mutedForeground }]}>{t('investments.noCategories')}</Text>
              </View>
            ) : (
              <>
                <View style={styles.categoryGrid}>
                  {(showAllCategories ? availableCategories : availableCategories.slice(0, 6)).map((cat) => (
                    <Pressable
                      key={cat.id}
                      style={[
                        styles.categoryButton,
                        { backgroundColor: colors.card, borderColor: colors.border },
                        formData.category === cat.id && { borderColor: colors.primary, backgroundColor: `${colors.primary}20` },
                      ]}
                      onPress={() => setFormData({ ...formData, category: cat.id })}
                    >
                      <View
                        style={[
                          styles.categoryIconContainer,
                          { backgroundColor: `${cat.color || colors.primary}20` },
                        ]}
                      >
                        <CategoryIcon
                          iconName={cat.icon}
                          size={20}
                          color={cat.color || colors.primary}
                        />
                      </View>
                      <Text
                        style={[
                          styles.categoryButtonText,
                          { color: colors.mutedForeground },
                          formData.category === cat.id && { color: colors.primary, fontWeight: '600' },
                        ]}
                      >
                        {translateCategoryName(cat.name, t, (cat as any).original_name)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                {availableCategories.length > 6 && (
                  <Pressable
                    style={styles.showMoreButton}
                    onPress={() => setShowAllCategories(!showAllCategories)}
                  >
                    <Text style={[styles.showMoreText, { color: colors.primary }]}>
                      {showAllCategories
                        ? t('addTransaction.showLess')
                        : t('addTransaction.showMore', { count: availableCategories.length - 6 })}
                    </Text>
                  </Pressable>
                )}
              </>
            )}
          </View>

          {/* Invested Amount and Currency */}
          <View style={styles.formRow}>
            <View style={[styles.formSection, { flex: 2, marginRight: 8 }]}>
              <Text style={[styles.formLabel, { color: colors.foreground }]}>{t('investments.investedAmount')}</Text>
              <TextInput
                style={[styles.amountInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.foreground }]}
                placeholder="0.00"
                placeholderTextColor={colors.mutedForeground}
                value={formData.investedAmount}
                onChangeText={(text) => setFormData({ ...formData, investedAmount: text })}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={[styles.formSection, { flex: 1, marginLeft: 8 }]}>
              <Text style={[styles.formLabel, { color: colors.foreground }]}>{t('addTransaction.currency')}</Text>
              <Pressable
                style={[styles.selectButton, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
                onPress={() => {
                  setCurrencySearch('');
                  setShowCurrencyModal(true);
                }}
              >
                <Text style={[styles.selectButtonText, { color: colors.foreground }]}>{formData.currency}</Text>
                <ChevronDown size={18} color={colors.mutedForeground} />
              </Pressable>
            </View>
          </View>

          {/* Current Value */}
          <View style={styles.formSection}>
            <Text style={[styles.formLabel, { color: colors.foreground }]}>{t('investments.currentValueOptional')}</Text>
            <TextInput
              style={[styles.amountInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.foreground }]}
              placeholder={t('investments.currentValuePlaceholder')}
              placeholderTextColor={colors.mutedForeground}
              value={formData.currentValue}
              onChangeText={(text) => setFormData({ ...formData, currentValue: text })}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Recurring */}
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.recurringHeader}>
              <View>
                <Text style={[styles.formLabel, { color: colors.foreground }]}>{t('investments.recurring')}</Text>
                <Text style={[styles.recurringSubtitle, { color: colors.mutedForeground }]}>{t('investments.recurringSubtitle')}</Text>
              </View>
              <Switch
                value={formData.isRecurring}
                onValueChange={(value) => setFormData({ ...formData, isRecurring: value })}
                trackColor={{ false: colors.muted, true: colors.primary }}
                thumbColor={colors.primaryForeground}
              />
            </View>

            {formData.isRecurring && (
              <View style={[styles.recurringOptions, { borderTopColor: colors.border }]}>
                <View style={styles.formSection}>
                  <Text style={[styles.formLabel, { color: colors.foreground }]}>{t('addTransaction.frequency')}</Text>
                  <Pressable
                    style={[styles.selectButton, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
                    onPress={() => setShowFrequencyModal(true)}
                  >
                    <Text style={[styles.selectButtonText, { color: colors.foreground }]}>
                      {t(`addTransaction.${formData.frequency}`)}
                    </Text>
                    <ChevronDown size={18} color={colors.mutedForeground} />
                  </Pressable>
                </View>
                <View style={styles.formSection}>
                  <Text style={[styles.formLabel, { color: colors.foreground }]}>{t('addTransaction.remindMeDaysBefore')}</Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.foreground }]}
                    value={formData.reminderDays}
                    onChangeText={(text) => setFormData({ ...formData, reminderDays: text })}
                    keyboardType="number-pad"
                  />
                </View>
              </View>
            )}
          </View>

          {/* Notes */}
          <View style={styles.formSection}>
            <Text style={[styles.formLabel, { color: colors.foreground }]}>{t('addTransaction.notesOptional')}</Text>
            <TextInput
              style={[styles.formInput, styles.textArea, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.foreground }]}
              placeholder={t('addTransaction.notesPlaceholder')}
              placeholderTextColor={colors.mutedForeground}
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Submit Button */}
          <Pressable
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.submitButtonText, { color: colors.primaryForeground }]}>
                {editingInvestment ? t('investments.updateInvestment') : t('investments.addInvestment')}
              </Text>
            )}
          </Pressable>
        </ScrollView>

        {/* Investment Date Picker */}
        {showInvestmentDatePicker && Platform.OS === 'ios' && (
          <Modal
            visible={showInvestmentDatePicker}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowInvestmentDatePicker(false)}
          >
            <View style={styles.datePickerModal}>
              <Pressable 
                style={{ flex: 1 }}
                onPress={() => setShowInvestmentDatePicker(false)}
              />
              <View style={[styles.datePickerContent, { backgroundColor: colors.card }]}>
                <View style={[styles.datePickerHeader, { borderBottomColor: colors.border }]}>
                  <Pressable onPress={() => setShowInvestmentDatePicker(false)}>
                    <Text style={[styles.datePickerCancel, { color: colors.mutedForeground }]}>{t('common.cancel')}</Text>
                  </Pressable>
                  <Text style={[styles.datePickerTitle, { color: colors.foreground }]}>{t('investments.selectDate') || 'Select Date'}</Text>
                  <Pressable
                    onPress={() => {
                      const formattedDate = formatDateForAPI(investmentDate);
                      setFormData({ ...formData, date: formattedDate });
                      setShowInvestmentDatePicker(false);
                    }}
                  >
                    <Text style={[styles.datePickerDone, { color: colors.primary }]}>{t('common.done')}</Text>
                  </Pressable>
                </View>
                <DateTimePicker
                  value={investmentDate}
                  mode="date"
                  display="spinner"
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      setInvestmentDate(selectedDate);
                    }
                  }}
                  maximumDate={new Date()}
                  textColor={isDark ? '#fff' : '#000'}
                  themeVariant={isDark ? 'dark' : 'light'}
                />
              </View>
            </View>
          </Modal>
        )}
        {showInvestmentDatePicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={investmentDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowInvestmentDatePicker(false);
              if (selectedDate) {
                setInvestmentDate(selectedDate);
                const formattedDate = formatDateForAPI(selectedDate);
                setFormData({ ...formData, date: formattedDate });
              }
            }}
            maximumDate={new Date()}
          />
        )}

        {/* Type Selection Modal */}
        <Modal
          visible={showTypeModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowTypeModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t('investments.type')}</Text>
                <Pressable onPress={() => setShowTypeModal(false)}>
                  <X size={24} color={colors.mutedForeground} />
                </Pressable>
              </View>
              <ScrollView style={styles.modalList}>
                {investmentTypes.map((type) => (
                  <Pressable
                    key={type.key}
                    style={[styles.modalItem, { borderBottomColor: colors.border }]}
                    onPress={() => {
                      setFormData({ ...formData, type: type.key });
                      setShowTypeModal(false);
                    }}
                  >
                    <Text style={[styles.modalItemText, { color: colors.foreground }, formData.type === type.key && { color: colors.primary, fontWeight: '600' }]}>
                      {type.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Currency Selection Modal (for form) */}
        <Modal
          visible={showCurrencyModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {
            setShowCurrencyModal(false);
            setCurrencySearch('');
          }}
        >
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t('reports.selectCurrency') || 'Select Currency'}</Text>
                <Pressable onPress={() => {
                  setShowCurrencyModal(false);
                  setCurrencySearch('');
                }}>
                  <X size={24} color={colors.mutedForeground} />
                </Pressable>
              </View>
              <View style={[styles.currencySearchContainer, { borderBottomColor: colors.border }]}>
                <TextInput
                  style={[styles.currencySearchInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.foreground }]}
                  placeholder={t('reports.searchCurrency') || 'Search currency...'}
                  placeholderTextColor={colors.mutedForeground}
                  value={currencySearch}
                  onChangeText={setCurrencySearch}
                />
              </View>
              <ScrollView style={styles.modalList} keyboardShouldPersistTaps="handled">
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
                        setFormData({ ...formData, currency: curr.code });
                        setShowCurrencyModal(false);
                        setCurrencySearch('');
                      }}
                    >
                      <Text style={[styles.modalItemText, { color: colors.foreground }, formData.currency === curr.code && { color: colors.primary, fontWeight: '600' }]}>
                        {curr.flag ? `${curr.flag} ` : ''}{curr.code} {curr.name ? `- ${curr.name}` : ''}
                      </Text>
                    </Pressable>
                  ))}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Frequency Selection Modal */}
        <Modal
          visible={showFrequencyModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowFrequencyModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t('addTransaction.frequency')}</Text>
                <Pressable onPress={() => setShowFrequencyModal(false)}>
                  <X size={24} color={colors.mutedForeground} />
                </Pressable>
              </View>
              <ScrollView style={styles.modalList}>
                {['monthly', 'quarterly', 'yearly'].map((freq) => (
                  <Pressable
                    key={freq}
                    style={[styles.modalItem, { borderBottomColor: colors.border }]}
                    onPress={() => {
                      setFormData({ ...formData, frequency: freq });
                      setShowFrequencyModal(false);
                    }}
                  >
                    <Text style={[styles.modalItemText, { color: colors.foreground }, formData.frequency === freq && { color: colors.primary, fontWeight: '600' }]}>
                      {t(`addTransaction.${freq}`)}
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

  // Main Investments List View
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
        <View>
          <Text style={[styles.headerTitle, responsiveTextStyles.h3, { color: colors.foreground }]}>{t('investments.title')}</Text>
        <Text style={[styles.headerSubtitle, responsiveTextStyles.bodySmall, { color: colors.mutedForeground }]}>{t('investments.subtitle')}</Text>
        </View>
        <Pressable
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowAddForm(true)}
        >
          <Text style={[styles.addButtonText, { color: colors.primaryForeground }]}>{t('investments.add')}</Text>
        </Pressable>
      </View>

      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 80 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Filters */}
        <View style={[styles.filtersContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Pressable
            style={[styles.filterButton, { backgroundColor: colors.muted, borderColor: colors.border }]}
            onPress={() => setShowDateRangeModal(true)}
          >
            <Calendar size={16} color={colors.mutedForeground} />
            <Text style={[styles.filterButtonText, { color: colors.foreground }]}>
              {dateRange === 'all' ? t('reports.allTime') :
               dateRange === 'this_month' ? t('investments.thisMonth') :
               dateRange === 'last_month' ? t('reports.lastMonth') :
               dateRange === 'this_year' ? t('investments.thisYear') :
               t('reports.customRange')}
            </Text>
            <ChevronDown size={16} color={colors.mutedForeground} />
          </Pressable>

          <Pressable
            style={[styles.filterButton, { backgroundColor: colors.muted, borderColor: colors.border }]}
            onPress={() => {
              setCurrencySearch('');
              setShowFilterCurrencyModal(true);
            }}
          >
            <DollarSign size={16} color={colors.mutedForeground} />
            <Text style={[styles.filterButtonText, { color: colors.foreground }]}>
              {selectedCurrency === 'ALL' ? t('investments.allCurrencies') : selectedCurrency}
            </Text>
            <ChevronDown size={16} color={colors.mutedForeground} />
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
                    {customDateFrom ? formatDateForDisplay(startDate) : 'dd/mm/yyyy'}
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
                    {customDateTo ? formatDateForDisplay(endDate) : 'dd/mm/yyyy'}
                  </Text>
                  <Calendar size={18} color={colors.mutedForeground} />
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* Date Pickers */}
        {showStartDatePicker && (
          <View>
            <DateTimePicker
              value={startDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleStartDateChange}
              maximumDate={endDate}
            />
            {Platform.OS === 'ios' && (
              <View style={{ backgroundColor: colors.card, padding: 10, alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: colors.border }}>
                  <Pressable 
                    onPress={() => setShowStartDatePicker(false)}
                    style={{ padding: 10 }}
                  >
                    <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 16 }}>{t('common.done') || 'Done'}</Text>
                  </Pressable>
              </View>
            )}
          </View>
        )}
        {showEndDatePicker && (
          <View>
            <DateTimePicker
              value={endDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleEndDateChange}
              minimumDate={startDate}
            />
            {Platform.OS === 'ios' && (
              <View style={{ backgroundColor: colors.card, padding: 10, alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: colors.border }}>
                  <Pressable 
                    onPress={() => setShowEndDatePicker(false)}
                    style={{ padding: 10 }}
                  >
                    <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 16 }}>{t('common.done') || 'Done'}</Text>
                  </Pressable>
              </View>
            )}
          </View>
        )}

        {/* Summary Cards */}
        <View style={styles.overviewGrid}>
          <View style={styles.overviewRow}>
            {/* Invested */}
            <View style={[styles.overviewCard, { 
              backgroundColor: isDark ? 'rgba(3, 169, 244, 0.15)' : '#E3F2FD' 
            }]}>
               <View style={{ marginBottom: 8 }}>
                 <DollarSign size={24} color="#03A9F4" />
               </View>
               <Text style={[styles.overviewLabel, responsiveTextStyles.body, { 
                 color: isDark ? colors.foreground : '#666' 
               }]}>{t('investments.invested')}</Text>
               <Text style={[styles.overviewValue, responsiveTextStyles.h3, { color: '#03A9F4' }]} numberOfLines={1} adjustsFontSizeToFit>
                 {displayCurrency !== 'ALL' ? displayCurrency : currency} {formatValue(totalInvested)}
               </Text>
            </View>

            {/* Current Value */}
            <View style={[styles.overviewCard, { 
              backgroundColor: isDark ? 'rgba(76, 175, 80, 0.15)' : '#E8F5E9' 
            }]}>
               <View style={{ marginBottom: 8 }}>
                 <TrendingUp size={24} color="#4CAF50" />
               </View>
               <Text style={[styles.overviewLabel, responsiveTextStyles.body, { 
                 color: isDark ? colors.foreground : '#666' 
               }]}>{t('investments.currentValue')}</Text>
               <Text style={[styles.overviewValue, responsiveTextStyles.h3, { color: '#4CAF50' }]} numberOfLines={1} adjustsFontSizeToFit>
                 {displayCurrency !== 'ALL' ? displayCurrency : currency} {formatValue(totalCurrent)}
               </Text>
            </View>
          </View>

          {/* Net Gain/Loss */}
          <View style={[styles.overviewCard, styles.netCardBase, { 
            backgroundColor: totalGainLoss >= 0 
              ? (isDark ? 'rgba(76, 175, 80, 0.15)' : '#E8F5E9')
              : (isDark ? 'rgba(255, 82, 82, 0.15)' : '#FFEBEE')
          }]}>
             <View style={{ marginBottom: 8 }}>
                 {totalGainLoss >= 0 ? (
                   <TrendingUp size={32} color="#4CAF50" />
                 ) : (
                   <TrendingDown size={32} color="#FF5252" />
                 )}
             </View>
             <Text style={[styles.overviewLabel, responsiveTextStyles.body, { 
               color: isDark ? colors.foreground : '#666' 
             }]}>{t('analytics.net')}</Text>
             <Text style={[styles.overviewValueLarge, responsiveTextStyles.h2, { color: totalGainLoss >= 0 ? '#4CAF50' : '#FF5252' }]} numberOfLines={1} adjustsFontSizeToFit>
               {totalGainLoss >= 0 ? '+' : ''}{displayCurrency !== 'ALL' ? displayCurrency : currency} {formatValue(Math.abs(totalGainLoss))}
             </Text>
             <Text style={[styles.overviewPercentage, responsiveTextStyles.caption, { 
               color: totalGainLoss >= 0 ? '#81C784' : '#E57373' 
             }]}>
               {totalGainLoss >= 0 ? '+' : ''}{gainLossPercentage.toFixed(2)}%
             </Text>
          </View>
        </View>

        {/* Portfolio Growth Chart */}
        {investments.length > 0 && monthlyData.length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.chartTitle, { color: colors.foreground }]}>{t('investments.portfolioGrowth')}</Text>
            <LineChart
              data={{
                labels: monthlyData.map(d => d.month),
                datasets: [
                  {
                    data: monthlyData.map(d => d.invested),
                    color: (opacity = 1) => `rgba(3, 169, 244, ${opacity})`,
                    strokeWidth: 2,
                  },
                  {
                    data: monthlyData.map(d => d.current),
                    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                    strokeWidth: 2,
                  },
                ],
              }}
              width={width - 64}
              height={220}
              chartConfig={{
                backgroundColor: colors.card,
                backgroundGradientFrom: colors.card,
                backgroundGradientTo: colors.card,
                decimalPlaces: 0,
                color: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
                labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                  stroke: colors.primary,
                },
                propsForLabels: {
                  fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
                  fontSize: 9,
                  fontWeight: '400',
                },
              }}
              bezier
              style={styles.chart}
            />
          </View>
        )}

        {/* Portfolio Distribution Chart */}
        {categoryData.length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.chartTitle, { color: colors.foreground }]}>{t('investments.portfolioDistribution')}</Text>
            <PieChart
              data={categoryData.map(item => ({
                ...item,
                legendFontColor: isDark ? colors.foreground : '#333',
              }))}
              width={width - 64}
              height={220}
              chartConfig={{
                backgroundColor: colors.card,
                backgroundGradientFrom: colors.card,
                backgroundGradientTo: colors.card,
                decimalPlaces: 0,
                color: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
                labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
                propsForLabels: {
                  fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
                  fontSize: 9,
                  fontWeight: '400',
                },
              }}
              accessor="value"
              backgroundColor="transparent"
              paddingLeft="15"
              style={styles.chart}
            />
          </View>
        )}

        {/* Investment List */}
        <View style={styles.investmentsSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('investments.yourInvestments')}</Text>
          {investments.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
              <TrendingUp size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyStateText, { color: colors.mutedForeground }]}>{t('investments.noInvestments')}</Text>
              <Pressable
                style={[styles.emptyStateButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowAddForm(true)}
              >
                <Text style={[styles.emptyStateButtonText, { color: colors.primaryForeground }]}>{t('investments.addInvestment')}</Text>
              </Pressable>
            </View>
          ) : (
            investments.map((investment) => {
              const category = investment.category;
              const investedAmount = (investment as any).invested_amount ?? (investment as any).investedAmount ?? 0;
              const currentValue = (investment as any).current_value ?? (investment as any).currentValue ?? 0;
              const investedAmountNum = typeof investedAmount === 'number' ? investedAmount : (parseFloat(String(investedAmount)) || 0);
              const currentValueNum = typeof currentValue === 'number' ? currentValue : (parseFloat(String(currentValue)) || 0);
              const gainLoss = currentValueNum - investedAmountNum;
              const gainLossPercentage = investedAmountNum > 0 ? ((gainLoss / investedAmountNum) * 100) : 0;

              return (
                <View key={investment.id} style={[styles.investmentCard, { backgroundColor: colors.card }]}>
                  <View style={styles.investmentHeader}>
                    <View style={styles.investmentLeft}>
                      <View
                        style={[
                          styles.investmentIconContainer,
                          { backgroundColor: category?.color ? `${category.color}20` : colors.muted },
                        ]}
                      >
                        <CategoryIcon
                          iconName={category?.icon}
                          size={20}
                          color={category?.color || colors.mutedForeground}
                        />
                      </View>
                      <View style={styles.investmentInfo}>
                        <Text style={[styles.investmentName, { color: colors.foreground }]}>{investment.name}</Text>
                        <View style={styles.investmentMeta}>
                          <Text style={[styles.investmentMetaText, { color: colors.mutedForeground }]}>
                            {category ? translateCategoryName(category.name, t, (category as any).original_name) : ''}
                          </Text>
                          <Text style={[styles.investmentMetaDot, { color: colors.mutedForeground }]}>•</Text>
                          <Text style={[styles.investmentMetaText, { color: colors.mutedForeground }]}>{investment.type}</Text>
                          {investment.recurring && (
                            <>
                              <Text style={[styles.investmentMetaDot, { color: colors.mutedForeground }]}>•</Text>
                              <View style={styles.recurringBadge}>
                                <Text style={styles.recurringBadgeText}>{t('addTransaction.recurring')}</Text>
                              </View>
                            </>
                          )}
                        </View>
                        <View style={styles.investmentAmounts}>
                          <View>
                            <Text style={[styles.investmentAmountLabel, { color: colors.mutedForeground }]}>{t('investments.invested')}</Text>
                            <Text style={[styles.investmentAmountValue, { color: colors.foreground }]}>
                              {investment.currency} {formatValue(investedAmountNum)}
                            </Text>
                          </View>
                          <View>
                            <Text style={[styles.investmentAmountLabel, { color: colors.mutedForeground }]}>{t('investments.currentValue')}</Text>
                            <Text style={[styles.investmentAmountValue, { color: colors.foreground }]}>
                              {investment.currency} {formatValue(currentValueNum)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    <View style={styles.investmentRight}>
                      <Text style={[styles.investmentGainLoss, gainLoss >= 0 ? styles.investmentGainLossPositive : styles.investmentGainLossNegative]}>
                        {gainLoss >= 0 ? '+' : ''}{investment.currency} {formatValue(Math.abs(gainLoss))}
                      </Text>
                      <Text style={[styles.investmentGainLossPercent, gainLoss >= 0 ? styles.investmentGainLossPercentPositive : styles.investmentGainLossPercentNegative]}>
                        {gainLoss >= 0 ? '+' : ''}{gainLossPercentage.toFixed(2)}%
                      </Text>
                      <View style={styles.investmentActions}>
                        <Pressable
                          style={styles.investmentActionButton}
                          onPress={() => handleEdit(investment)}
                        >
                          <Edit2 size={18} color="#03A9F4" />
                        </Pressable>
                        <Pressable
                          style={styles.investmentActionButton}
                          onPress={() => setDeletingInvestment(investment)}
                        >
                          <Trash2 size={18} color="#FF5252" />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={!!deletingInvestment}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setDeletingInvestment(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t('investments.deleteInvestment')}</Text>
            <Text style={[styles.modalDescription, { color: colors.mutedForeground }]}>
              {t('investments.deleteInvestmentConfirm', { name: deletingInvestment?.name })}
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonCancel, { backgroundColor: colors.muted }]}
                onPress={() => setDeletingInvestment(null)}
              >
                <Text style={[styles.modalButtonCancelText, { color: colors.foreground }]}>{t('investments.cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalButtonDelete, { backgroundColor: colors.destructive }]}
                onPress={handleDelete}
              >
                <Text style={[styles.modalButtonDeleteText, { color: colors.destructiveForeground }]}>{t('investments.delete')}</Text>
              </Pressable>
            </View>
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
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t('investments.dateRange')}</Text>
              <Pressable onPress={() => setShowDateRangeModal(false)}>
                <X size={24} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalList}>
              {['all', 'this_month', 'last_month', 'this_year', 'custom'].map((range) => (
                <Pressable
                  key={range}
                  style={[styles.modalItem, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setDateRange(range);
                    setShowDateRangeModal(false);
                  }}
                >
                  <Text style={[styles.modalItemText, { color: colors.foreground }, dateRange === range && { color: colors.primary, fontWeight: '600' }]}>
                    {range === 'all' ? t('reports.allTime') :
                     range === 'this_month' ? t('investments.thisMonth') :
                     range === 'last_month' ? t('reports.lastMonth') :
                     range === 'this_year' ? t('investments.thisYear') :
                     t('reports.customRange')}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Filter Currency Modal */}
      <Modal
        visible={showFilterCurrencyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowFilterCurrencyModal(false);
          setCurrencySearch('');
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t('reports.selectCurrency') || 'Select Currency'}</Text>
              <Pressable onPress={() => {
                setShowFilterCurrencyModal(false);
                setCurrencySearch('');
              }}>
                <X size={24} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <View style={[styles.currencySearchContainer, { borderBottomColor: colors.border }]}>
              <TextInput
                style={[styles.currencySearchInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.foreground }]}
                placeholder={t('reports.searchCurrency') || 'Search currency...'}
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
                  setShowFilterCurrencyModal(false);
                  setCurrencySearch('');
                }}
              >
                <Text style={[styles.modalItemText, { color: colors.foreground }, selectedCurrency === 'ALL' && { color: colors.primary, fontWeight: '600' }]}>
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
                      setShowFilterCurrencyModal(false);
                      setCurrencySearch('');
                    }}
                  >
                    <Text style={[styles.modalItemText, { color: colors.foreground }, selectedCurrency === curr.code && { color: colors.primary, fontWeight: '600' }]}>
                      {curr.flag ? `${curr.flag} ` : ''}{curr.code} {curr.name ? `- ${curr.name}` : ''}
                    </Text>
                  </Pressable>
                ))}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Type Selection Modal */}
      <Modal
        visible={showTypeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t('investments.type')}</Text>
              <Pressable onPress={() => setShowTypeModal(false)}>
                <X size={24} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalList}>
              {investmentTypes.map((type) => (
                <Pressable
                  key={type.key}
                  style={[styles.modalItem, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setFormData({ ...formData, type: type.key });
                    setShowTypeModal(false);
                  }}
                >
                  <Text style={[styles.modalItemText, { color: colors.foreground }, formData.type === type.key && { color: colors.primary, fontWeight: '600' }]}>
                    {type.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Currency Selection Modal (for form) */}
      <Modal
        visible={showCurrencyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowCurrencyModal(false);
          setCurrencySearch('');
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t('reports.selectCurrency') || 'Select Currency'}</Text>
              <Pressable onPress={() => {
                setShowCurrencyModal(false);
                setCurrencySearch('');
              }}>
                <X size={24} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <View style={[styles.currencySearchContainer, { borderBottomColor: colors.border }]}>
              <TextInput
                style={[styles.currencySearchInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.foreground }]}
                placeholder={t('reports.searchCurrency') || 'Search currency...'}
                placeholderTextColor={colors.mutedForeground}
                value={currencySearch}
                onChangeText={setCurrencySearch}
              />
            </View>
            <ScrollView style={styles.modalList} keyboardShouldPersistTaps="handled">
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
                      setFormData({ ...formData, currency: curr.code });
                      setShowCurrencyModal(false);
                      setCurrencySearch('');
                    }}
                  >
                    <Text style={[styles.modalItemText, { color: colors.foreground }, formData.currency === curr.code && { color: colors.primary, fontWeight: '600' }]}>
                      {curr.flag ? `${curr.flag} ` : ''}{curr.code} {curr.name ? `- ${curr.name}` : ''}
                    </Text>
                  </Pressable>
                ))}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Frequency Selection Modal */}
      <Modal
        visible={showFrequencyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFrequencyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t('addTransaction.frequency')}</Text>
              <Pressable onPress={() => setShowFrequencyModal(false)}>
                <X size={24} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalList}>
              {['monthly', 'quarterly', 'yearly'].map((freq) => (
                <Pressable
                  key={freq}
                  style={[styles.modalItem, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setFormData({ ...formData, frequency: freq });
                    setShowFrequencyModal(false);
                  }}
                >
                  <Text style={[styles.modalItemText, { color: colors.foreground }, formData.frequency === freq && { color: colors.primary, fontWeight: '600' }]}>
                    {t(`addTransaction.${freq}`)}
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
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    ...textStyles.h3,
    marginBottom: 4,
  },
  headerSubtitle: {
    ...textStyles.bodySmall,
    color: '#666',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#03A9F4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    ...textStyles.button,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
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
    ...textStyles.body,
    color: '#333',
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
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    minWidth: 100,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    ...textStyles.caption,
  },
  summaryValue: {
    fontWeight: 'bold',
  },
  summaryValuePositive: {
    color: '#4CAF50',
  },
  summaryValueNegative: {
    color: '#FF5252',
  },
  summaryPercentage: {
    ...textStyles.caption,
    marginTop: 4,
    color: '#666',
  },
  summaryPercentagePositive: {
    color: '#4CAF50',
  },
  summaryPercentageNegative: {
    color: '#FF5252',
  },
  chartCard: {
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
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  investmentsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    ...textStyles.h3,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  emptyStateText: {
    ...textStyles.body,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
  },
  emptyStateButton: {
    marginTop: 16,
    backgroundColor: '#03A9F4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#fff',
    ...textStyles.button,
    fontWeight: '600',
  },
  investmentCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  investmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  investmentLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  investmentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  investmentInfo: {
    flex: 1,
  },
  investmentName: {
    ...textStyles.h3,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  investmentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  investmentMetaText: {
    ...textStyles.caption,
    color: '#666',
  },
  investmentMetaDot: {
    ...textStyles.caption,
    color: '#666',
  },
  recurringBadge: {
    backgroundColor: 'rgba(3, 169, 244, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recurringBadgeText: {
    ...textStyles.small,
    color: '#03A9F4',
  },
  investmentAmounts: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  investmentAmountLabel: {
    ...textStyles.labelSmall,
    color: '#666',
    marginBottom: 2,
  },
  investmentAmountValue: {
    ...textStyles.bodySmall,
    color: '#333',
  },
  investmentRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  investmentGainLoss: {
    ...textStyles.body,
    fontWeight: 'bold',
  },
  investmentGainLossPositive: {
    color: '#4CAF50',
  },
  investmentGainLossNegative: {
    color: '#FF5252',
  },
  investmentGainLossPercent: {
    ...textStyles.caption,
  },
  investmentGainLossPercentPositive: {
    color: '#4CAF50',
  },
  investmentGainLossPercentNegative: {
    color: '#FF5252',
  },
  investmentActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  investmentActionButton: {
    padding: 8,
  },
  // Form styles
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  formHeaderTitle: {
    ...textStyles.h3,
    fontWeight: 'bold',
    color: '#333',
  },
  formScrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  formSection: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
  },
  formLabel: {
    ...textStyles.label,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  formInput: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    ...textStyles.body,
    color: '#333',
  },
  amountInput: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    ...textStyles.body,
    color: '#333',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectButtonText: {
    flex: 1,
    ...textStyles.body,
    color: '#333',
  },
  selectButtonPlaceholder: {
    color: '#999',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryButton: {
    width: '30%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  categoryButtonActive: {
    borderColor: '#03A9F4',
    backgroundColor: 'rgba(3, 169, 244, 0.1)',
  },
  categoryIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryButtonText: {
    ...textStyles.labelSmall,
    color: '#666',
    textAlign: 'center',
  },
  categoryButtonTextActive: {
    color: '#03A9F4',
    fontWeight: '600',
  },
  showMoreButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  showMoreText: {
    ...textStyles.body,
    color: '#03A9F4',
  },
  emptyCategories: {
    padding: 20,
    alignItems: 'center',
  },
  emptyCategoriesText: {
    ...textStyles.body,
    color: '#999',
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  recurringHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recurringSubtitle: {
    ...textStyles.caption,
    color: '#666',
    marginTop: 4,
  },
  recurringOptions: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  submitButton: {
    backgroundColor: '#03A9F4',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    ...textStyles.button,
    fontWeight: '600',
  },
  // Modal styles
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
  modalDescription: {
    ...textStyles.bodySmall,
    color: '#666',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  modalButtonCancel: {
    backgroundColor: '#f5f5f5',
  },
  modalButtonCancelText: {
    color: '#666',
    ...textStyles.button,
    fontWeight: '600',
  },
  modalButtonDelete: {
    backgroundColor: '#FF5252',
  },
  modalButtonDeleteText: {
    color: '#fff',
    ...textStyles.button,
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
    ...textStyles.bodySmall,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  overviewGrid: {
    marginTop: 12,
    gap: 12,
    marginBottom: 24,
  },
  overviewRow: {
    flexDirection: 'row',
    gap: 12,
  },
  overviewCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  netCardBase: {
    width: '100%',
  },
  overviewLabel: {
    textAlign: 'center',
    marginBottom: 4,
  },
  overviewValue: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  overviewValueLarge: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  overviewPercentage: {
    marginTop: 4,
    textAlign: 'center',
    opacity: 0.9,
  },
  datePickerModal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  datePickerContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  datePickerCancel: {
    ...textStyles.body,
  },
  datePickerTitle: {
    ...textStyles.body,
    fontWeight: '600',
  },
  datePickerDone: {
    ...textStyles.body,
    fontWeight: '600',
  },
});

