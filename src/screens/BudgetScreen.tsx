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
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { fonts, textStyles, createResponsiveTextStyles } from '../constants/fonts';
import { useTranslation } from 'react-i18next';
import {
  Edit2,
  Trash2,
  AlertCircle,
  X,
  ChevronDown,
  DollarSign,
  TrendingDown,
} from 'lucide-react-native';
import { PieChart } from 'react-native-chart-kit';
import { budgetsService } from '../api/services/budgets';
import { categoriesService } from '../api/services/categories';
import { currenciesService, Currency } from '../api/services/currencies';
import { dashboardService } from '../api/services/dashboard';
import { authService } from '../api/services/auth';
import { getBudgetPeriodFromCycleDay, formatDateForDisplay } from '../api/utils/dateUtils';
import { translateCategoryName } from '../utils/categoryTranslator';
import { CategoryIcon } from '../components/CategoryIcon';
import { useCategories } from '../hooks/useCategories';
import { getEmojiFromIcon } from '../utils/iconMapper';
import { useTheme } from '../contexts/ThemeContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { showToast } from '../utils/toast';

interface CategoryBudget {
  id: string;
  name: string;
  icon: string;
  spent: number;
  budget: number;
  color: string;
  currency: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string | null;
  type: 'income' | 'expense' | 'both';
}

export default function BudgetScreen() {
  const { t, i18n } = useTranslation('common');
  const { width } = useWindowDimensions();
  const { isDark, colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [budgetCycleDay, setBudgetCycleDay] = useState(1);
  
  // Budget data
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([]);
  // Use useCategories hook for automatic refetch on language change
  const { categories: categoriesData } = useCategories();
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  
  // Sync categories from hook to local state
  useEffect(() => {
    if (categoriesData && categoriesData.length > 0) {
      setAvailableCategories(categoriesData.map((cat: any) => ({
        id: String(cat.id || cat.name),
        name: cat.name,
        icon: cat.icon || 'CircleEllipsis',
        color: cat.color,
        type: cat.type || 'both',
      })));
    }
  }, [categoriesData]);
  
  // UI states
  const [isAdding, setIsAdding] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [budgetValue, setBudgetValue] = useState('');
  
  // Add budget form
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryBudget, setNewCategoryBudget] = useState('');
  const [newCategoryCurrency, setNewCategoryCurrency] = useState(currency);
  
  // Modals
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [currencySearch, setCurrencySearch] = useState('');

  const responsiveTextStyles = createResponsiveTextStyles(width);
  


  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (currency) {
      loadBudgetData();
    }
  }, [currency]);

  const loadInitialData = async () => {
    try {
      // Get user currency and budget cycle day
      const userData = await authService.getCurrentUser();
      const defaultCurrency = userData.defaultCurrency || 'USD';
      setCurrency(defaultCurrency);
      setNewCategoryCurrency(defaultCurrency);
      
      // Get dashboard summary for budget cycle day
      try {
        const summary = await dashboardService.getSummary();
        setBudgetCycleDay((summary as any).budgetCycleDay || 1);
      } catch (error) {
        console.error('Failed to load dashboard summary:', error);
      }
      
      // Load currencies
      try {
        const currenciesData = await currenciesService.getCurrencies();
        setCurrencies(currenciesData);
      } catch (error) {
        console.error('Failed to load currencies:', error);
      }
      
      // Categories are now loaded via useCategories hook, skip manual loading
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const loadBudgetData = async () => {
    try {
      setLoading(true);
      
      // Fetch category budgets
      const budgetsResponse = await budgetsService.getCategoryBudgets({ per_page: 100 });
      
      // Transform budgets to match the expected format
      const transformedBudgets = budgetsResponse.data.map((b: any) => {
        const category = availableCategories.find(c => c.name === b.category);
        return {
          id: String(b.id),
          name: b.category,
          icon: b.icon || category?.icon || 'CircleEllipsis',
          spent: b.spent || 0,
          budget: b.budgetAmount || b.budget || 0,
          color: b.color || category?.color || '#03A9F4',
          currency: b.currency || currency,
        };
      });
      
      setCategoryBudgets(transformedBudgets);
    } catch (error) {
      console.error('Failed to load budget data:', error);
      showToast.error('Failed to load budgets. Please try again.', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBudgetData();
    setRefreshing(false);
  };

  const handleAddBudget = async () => {
    const name = newCategoryName.trim();
    const budget = parseFloat(newCategoryBudget);

    if (!name || isNaN(budget) || budget <= 0) {
      showToast.error('Please enter a valid category and budget amount.', 'Error');
      return;
    }

    try {
      setLoading(true);
      
      const currentUser = await authService.getCurrentUser();
      const cycleDay = budgetCycleDay || 1;
      const budgetPeriod = getBudgetPeriodFromCycleDay(cycleDay);

      // Check for duplicate budget before submitting
      const existingBudget = categoryBudgets.find(
        (b) => b.name.toLowerCase() === name.toLowerCase()
      );
      
      if (existingBudget) {
        showToast.info(
          t('budget.duplicateBudgetMessage', { category: name }) || 
          `A budget for "${name}" already exists. Please edit the existing budget or choose a different category.`
        );
        setLoading(false);
        return;
      }

      await budgetsService.createCategoryBudget({
        category: name,
        budget_amount: budget,
        currency: newCategoryCurrency,
        period: 'monthly',
        start_date: budgetPeriod.start,
        end_date: budgetPeriod.end,
        user_id: currentUser.id,
        budget_cycle_day: cycleDay,
      });

      await loadBudgetData();
      setIsAdding(false);
      setNewCategoryName('');
      setNewCategoryBudget('');
      setNewCategoryCurrency(currency);
      if (Platform.OS === 'web') {
        window.alert('Budget added successfully');
      } else {
        showToast.success('Budget added successfully', 'Success');
      }
    } catch (error: any) {
      console.error('Error adding budget:', error);
      
      // Handle validation errors from backend
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors?.category?.[0] ||
                          error.response?.data?.error ||
                          'Failed to add budget. Please try again.';
      
      showToast.error(
        errorMessage,
        t('budget.error') || 'Error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBudget = async (categoryId: string) => {
    const newBudget = parseFloat(budgetValue);
    if (isNaN(newBudget) || newBudget < 0) {
      showToast.error('Please enter a valid budget amount.', 'Error');
      return;
    }

    try {
      setLoading(true);
      
      const budget = categoryBudgets.find(b => b.id === categoryId);
      if (!budget) return;
      
      // Get current month range
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);
      
      await budgetsService.updateCategoryBudget(Number(categoryId), {
        budget_amount: newBudget,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
      });
      
      await loadBudgetData();
      setEditingCategory(null);
      setBudgetValue('');
      showToast.success('Budget updated successfully', 'Success');
    } catch (error: any) {
      console.error('Error updating budget:', error);
      showToast.error(error.response?.data?.message || 'Failed to update budget. Please try again.', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBudget = async (categoryId: string) => {
    Alert.alert(
      t('budget.deleteConfirm') || 'Delete Budget',
      t('budget.deleteConfirm') || 'Are you sure you want to delete this budget?',
      [
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('common.delete') || 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await budgetsService.deleteCategoryBudget(Number(categoryId));
              await loadBudgetData();
              showToast.success('Budget deleted successfully', 'Success');
            } catch (error: any) {
              console.error('Error deleting budget:', error);
              showToast.error(error.response?.data?.message || 'Failed to delete budget. Please try again.', 'Error');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleEditBudget = (categoryId: string, currentBudget: number) => {
    setEditingCategory(categoryId);
    setBudgetValue(currentBudget.toString());
  };

  const budgetPeriod = useMemo(() => {
    const cycleDay = (budgetCycleDay && budgetCycleDay >= 1 && budgetCycleDay <= 31) ? budgetCycleDay : 1;
    try {
      return getBudgetPeriodFromCycleDay(cycleDay);
    } catch (error) {
      console.error('Error calculating budget period:', error);
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      };
    }
  }, [budgetCycleDay]);

  // Only sum budgets that match the selected currency to avoid mixing currencies
  const budgetsInSelectedCurrency = categoryBudgets.filter(cat => cat.currency === currency);
  const totalSpent = budgetsInSelectedCurrency.reduce((sum, cat) => sum + cat.spent, 0);
  const totalBudget = budgetsInSelectedCurrency.reduce((sum, cat) => sum + cat.budget, 0);
  const totalUsagePercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Prepare pie chart data (top 5 categories)
  const chartData = categoryBudgets
    .filter(cat => cat.spent > 0)
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 5)
    .map(cat => ({
      name: translateCategoryName(cat.name, t, (cat as any).original_name),
      value: cat.spent,
      color: cat.color,
      legendFontColor: colors.foreground,
      legendFontSize: 12,
    }));

  const formatValue = (value: number): string => {
    return value.toLocaleString(i18n.language, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getCurrencySymbol = (currencyCode: string): string => {
    const curr = currencies.find(c => c.code === currencyCode);
    return curr?.symbol || currencyCode;
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
        <View>
          <Text style={[styles.headerTitle, responsiveTextStyles.h3, { color: colors.foreground }]}>{t('budget.title') || 'Categories & Budget'}</Text>
          <Text style={[styles.headerSubtitle, responsiveTextStyles.bodySmall, { color: colors.mutedForeground }]}>{t('budget.subtitle') || 'Manage your spending by category'}</Text>
        </View>
        <Pressable
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setIsAdding(true)}
        >
          <Text style={styles.addButtonText}>{t('budget.addBudget')}</Text>
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
        {/* Add Budget Form */}
        {isAdding && (
          <View style={[styles.addFormCard, { backgroundColor: colors.card }]}>
            <View style={styles.formSection}>
              <Text style={[styles.formLabel, { color: colors.foreground }]}>{t('addTransaction.category') || 'Category'}</Text>
              <Pressable
                style={[styles.selectButton, { backgroundColor: colors.muted, borderColor: colors.border }]}
                onPress={() => setShowCategoryModal(true)}
              >
                <Text style={[styles.selectButtonText, { color: colors.foreground }, !newCategoryName && [styles.selectButtonPlaceholder, { color: colors.mutedForeground }]]}>
                  {newCategoryName
                    ? translateCategoryName(newCategoryName, t)
                    : t('budget.chooseCategory') || 'Choose category'}
                </Text>
                <ChevronDown size={18} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <View style={styles.formSection}>
              <Text style={[styles.formLabel, { color: colors.foreground }]}>{t('addTransaction.currency') || 'Currency'}</Text>
              <Pressable
                style={[styles.selectButton, { backgroundColor: colors.muted, borderColor: colors.border }]}
                onPress={() => setShowCurrencyModal(true)}
              >
                <Text style={[styles.selectButtonText, { color: colors.foreground }]}>
                  {(() => {
                    const selectedCurrency = currencies.find(c => c.code === newCategoryCurrency);
                    if (selectedCurrency) {
                      return `${selectedCurrency.flag ? selectedCurrency.flag + ' ' : ''}${selectedCurrency.code} (${selectedCurrency.symbol})`;
                    }
                    return newCategoryCurrency;
                  })()}
                </Text>
                <ChevronDown size={18} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <View style={styles.formSection}>
              <Text style={[styles.formLabel, { color: colors.foreground }]}>
                {t('budget.monthlyBudget', { currency: newCategoryCurrency }) || `Monthly budget (${newCategoryCurrency})`}
              </Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
                placeholder="0.00"
                placeholderTextColor={colors.mutedForeground}
                value={newCategoryBudget}
                onChangeText={setNewCategoryBudget}
                keyboardType="decimal-pad"
              />
              <Text style={[styles.formHelperText, { color: colors.mutedForeground }]}>
                {t('budget.periodInfo') || 'This budget will apply for the period:'}{' '}
                <Text style={[styles.formHelperTextBold, { color: colors.foreground }]}>
                  {formatDateForDisplay(budgetPeriod.start, i18n.language)} - {formatDateForDisplay(budgetPeriod.end, i18n.language)}
                </Text>
              </Text>
            </View>

            <View style={styles.formActions}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => {
                  setIsAdding(false);
                  setNewCategoryName('');
                  setNewCategoryBudget('');
                }}
              >
                <Text style={[styles.cancelButtonText, { color: colors.mutedForeground }]}>{t('addTransaction.cancel') || 'Cancel'}</Text>
              </Pressable>
              <Pressable
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleAddBudget}
              >
                <Text style={styles.saveButtonText}>{t('budget.saveBudget') || 'Save Budget'}</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Summary Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            {/* Total Budget */}
            <View style={[styles.statsCard, { 
              backgroundColor: isDark ? 'rgba(3, 169, 244, 0.15)' : '#E3F2FD' 
            }]}>
               <View style={{ marginBottom: 8 }}>
                 <DollarSign size={24} color="#03A9F4" />
               </View>
               <Text style={[styles.statsLabel, responsiveTextStyles.body, { 
                 color: isDark ? colors.foreground : '#666' 
               }]}>{t('budget.totalBudget') || 'Total Budget'}</Text>
               <Text style={[styles.statsValue, responsiveTextStyles.h3, { color: '#03A9F4' }]} numberOfLines={1} adjustsFontSizeToFit>
                 {currency} {formatValue(totalBudget)}
               </Text>
            </View>

            {/* Total Spent */}
            <View style={[styles.statsCard, { 
              backgroundColor: isDark ? 'rgba(255, 82, 82, 0.15)' : '#FFEBEE' 
            }]}>
               <View style={{ marginBottom: 8 }}>
                 <TrendingDown size={24} color="#FF5252" />
               </View>
               <Text style={[styles.statsLabel, responsiveTextStyles.body, { 
                 color: isDark ? colors.foreground : '#666' 
               }]}>{t('budget.totalSpent') || 'Total Spent'}</Text>
               <Text style={[styles.statsValue, responsiveTextStyles.h3, { color: '#FF5252' }]} numberOfLines={1} adjustsFontSizeToFit>
                 {currency} {formatValue(totalSpent)}
               </Text>
            </View>
          </View>
        </View>
        <View style={[styles.overviewCard, { backgroundColor: colors.card }]}>
          <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(totalUsagePercent, 100)}%`,
                  backgroundColor: totalSpent > totalBudget ? '#FF5252' : '#03A9F4',
                },
              ]}
            />
          </View>
          <View style={styles.overviewFooter}>
            <Text style={[styles.overviewFooterText, { color: colors.mutedForeground }]}>
              {totalUsagePercent.toFixed(1)}% {t('dashboard.used') || 'used'}
            </Text>
            <Text style={[styles.overviewFooterText, { color: colors.mutedForeground }]}>
              {currency} {formatValue(Math.max(0, totalBudget - totalSpent))} {t('dashboard.remaining') || 'remaining'}
            </Text>
          </View>
        </View>

        {/* Spending Pie Chart */}
        {chartData.length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.chartTitle, { color: colors.foreground }]}>{t('analytics.topSpendingCategory') || 'Top Spending Categories'}</Text>
            <PieChart
              data={chartData}
              width={width - 64}
              height={220}
              chartConfig={{
                backgroundColor: colors.card,
                backgroundGradientFrom: colors.card,
                backgroundGradientTo: colors.card,
                decimalPlaces: 0,
                color: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
                labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity * 0.9})` : `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="value"
              backgroundColor="transparent"
              paddingLeft="15"
              style={styles.chart}
            />
          </View>
        )}

        {/* Category Budget List */}
        <View style={styles.budgetsSection}>
          <Text style={[styles.sectionTitle, responsiveTextStyles.h3, { color: colors.foreground }]}>{t('budget.limits') || 'Budget Limits'}</Text>
          {categoryBudgets.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, { color: colors.mutedForeground }]}>
                {t('budget.noBudgets') || 'No budgets set yet. Add a budget to start tracking your spending.'}
              </Text>
            </View>
          ) : (
            categoryBudgets.map((category) => {
              const percentage = category.budget > 0 ? (category.spent / category.budget) * 100 : 0;
              const isOverBudget = category.spent > category.budget;
              const isNearLimit = percentage >= 80 && percentage < 100;

              return (
                <View
                  key={category.id}
                  style={[
                    styles.budgetCard,
                    { backgroundColor: colors.card },
                    isOverBudget && styles.budgetCardOver,
                    isNearLimit && !isOverBudget && styles.budgetCardNear,
                  ]}
                >
                  <View style={styles.budgetHeader}>
                    <View style={styles.budgetHeaderLeft}>
                      <View
                        style={[
                          styles.budgetIconContainer,
                          { backgroundColor: `${category.color}20` },
                        ]}
                      >
                        <CategoryIcon
                          iconName={category.icon}
                          size={20}
                          color={category.color}
                        />
                      </View>
                      <View style={styles.budgetInfo}>
                        <Text style={[styles.budgetName, responsiveTextStyles.body, { color: colors.foreground, fontWeight: '600' }]}>
                          {translateCategoryName(category.name, t, (category as any).original_name)}
                        </Text>
                        <View style={styles.budgetMeta}>
                          <Text style={[styles.budgetAmount, responsiveTextStyles.bodySmall, { color: colors.mutedForeground }]}>
                            {getCurrencySymbol(category.currency)} {formatValue(category.spent)} / {formatValue(category.budget)}
                          </Text>
                          <Text style={[styles.budgetCurrency, { color: colors.mutedForeground }]}> ({category.currency})</Text>
                          {isOverBudget && (
                            <View style={styles.alertBadge}>
                              <AlertCircle size={14} color="#FF5252" />
                              <Text style={[styles.alertText, { color: '#FF5252' }]}>{t('budget.overBudget') || 'Over budget'}</Text>
                            </View>
                          )}
                          {isNearLimit && !isOverBudget && (
                            <View style={[styles.alertBadge, { backgroundColor: 'rgba(255,193,7,0.1)' }]}>
                              <AlertCircle size={14} color="#FFC107" />
                              <Text style={[styles.alertText, { color: '#FFC107' }]}>{t('budget.nearLimit') || 'Near limit'}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                    <View style={styles.budgetActions}>
                      {editingCategory === category.id ? (
                        <View style={styles.editForm}>
                          <TextInput
                            style={[styles.editInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
                            value={budgetValue}
                            onChangeText={setBudgetValue}
                            keyboardType="decimal-pad"
                            autoFocus
                          />
                          <Pressable
                            style={[styles.saveEditButton, { backgroundColor: colors.primary }]}
                            onPress={() => handleUpdateBudget(category.id)}
                          >
                            <Text style={styles.saveEditButtonText}>{t('budget.save') || 'Save'}</Text>
                          </Pressable>
                        </View>
                      ) : (
                        <>
                          <Pressable
                            style={styles.actionButton}
                            onPress={() => handleEditBudget(category.id, category.budget)}
                          >
                            <Edit2 size={18} color={colors.primary} />
                          </Pressable>
                          <Pressable
                            style={styles.actionButton}
                            onPress={() => handleDeleteBudget(category.id)}
                          >
                            <Trash2 size={18} color="#FF5252" />
                          </Pressable>
                        </>
                      )}
                    </View>
                  </View>
                  <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min(percentage, 100)}%`,
                          backgroundColor: isOverBudget ? '#FF5252' : isNearLimit ? '#FFC107' : '#03A9F4',
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.budgetFooter}>
                    <Text style={styles.budgetFooterText}>
                      {percentage.toFixed(0)}% {t('dashboard.used') || 'used'}
                    </Text>
                    <Text style={styles.budgetFooterText}>
                      {getCurrencySymbol(category.currency)} {formatValue(Math.max(0, category.budget - category.spent))} {t('budget.left') || 'left'}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowCategoryModal(false);
          setCategorySearch('');
        }}
      >
        <View style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t('budget.chooseCategory') || 'Choose Category'}</Text>
              <Pressable onPress={() => {
                setShowCategoryModal(false);
                setCategorySearch('');
              }}>
                <X size={24} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <View style={[styles.searchContainer, { borderBottomColor: colors.border }]}>
              <TextInput
                style={[styles.searchInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
                placeholder={t('budget.searchCategory') || 'Search category...'}
                placeholderTextColor={colors.mutedForeground}
                value={categorySearch}
                onChangeText={setCategorySearch}
              />
            </View>
            <ScrollView style={styles.modalList}>
              {availableCategories
                .filter(cat => {
                  // Filter by type
                  if (cat.type !== 'expense' && cat.type !== 'both') return false;
                  // Filter by search text
                  if (categorySearch.trim()) {
                    const searchLower = categorySearch.toLowerCase();
                    const categoryName = translateCategoryName(cat.name, t).toLowerCase();
                    return categoryName.includes(searchLower) || cat.name.toLowerCase().includes(searchLower);
                  }
                  return true;
                })
                .map((category) => (
                  <Pressable
                    key={category.id}
                    style={[styles.modalItem, { borderBottomColor: colors.border }]}
                    onPress={() => {
                      setNewCategoryName(category.name);
                      setShowCategoryModal(false);
                      setCategorySearch('');
                    }}
                  >
                    <View style={styles.modalItemLeft}>
                      <View
                        style={[
                          styles.modalItemIcon,
                          { backgroundColor: `${category.color || '#03A9F4'}20` },
                        ]}
                      >
                        <CategoryIcon
                          iconName={category.icon}
                          size={20}
                          color={category.color || '#03A9F4'}
                        />
                      </View>
                      <Text style={[styles.modalItemText, { color: colors.foreground }, newCategoryName === category.name && [styles.modalItemTextActive, { color: colors.primary }]]}>
                        {translateCategoryName(category.name, t)}
                      </Text>
                    </View>
                  </Pressable>
                ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Currency Selection Modal */}
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
          style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t('addTransaction.selectCurrency') || 'Select Currency'}</Text>
              <Pressable onPress={() => {
                setShowCurrencyModal(false);
                setCurrencySearch('');
              }}>
                <X size={24} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <View style={[styles.searchContainer, { borderBottomColor: colors.border }]}>
              <TextInput
                style={[styles.searchInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
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
                    (curr.name || '').toLowerCase().includes(q) ||
                    (curr.symbol || '').toLowerCase().includes(q)
                  );
                })
                .map((curr) => (
                  <Pressable
                    key={curr.code}
                    style={[styles.modalItem, { borderBottomColor: colors.border }]}
                    onPress={() => {
                      setNewCategoryCurrency(curr.code);
                      setShowCurrencyModal(false);
                      setCurrencySearch('');
                    }}
                  >
                    <Text style={[styles.modalItemText, { color: colors.foreground }, newCategoryCurrency === curr.code && [styles.modalItemTextActive, { color: colors.primary }]]}>
                      {curr.flag ? `${curr.flag} ` : ''}{curr.code} {curr.name ? `- ${curr.name}` : ''} ({curr.symbol})
                    </Text>
                  </Pressable>
                ))}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
    ...textStyles.button,
    color: '#fff',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  addFormCard: {
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
  formSection: {
    marginBottom: 16,
  },
  formLabel: {
    ...textStyles.label,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
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
    ...textStyles.bodySmall,
    color: '#333',
  },
  selectButtonPlaceholder: {
    color: '#999',
  },
  formInput: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    ...textStyles.bodySmall, // Keep font size to match textStyles.bodySmall roughly for inputs
    color: '#333',
  },
  formHelperText: {
    ...textStyles.caption,
    color: '#666',
    marginTop: 8,
  },
  formHelperTextBold: {
    fontWeight: '600',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    ...textStyles.bodySmall,
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#03A9F4',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveButtonText: {
    ...textStyles.bodySmall,
    color: '#fff',
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryLabel: {
    ...textStyles.caption,
    marginBottom: 8,
  },
  summaryValue: {
    ...textStyles.h2,
    fontWeight: 'bold',
  },
  overviewCard: {
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
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  overviewRight: {
    alignItems: 'flex-end',
  },
  overviewLabel: {
    ...textStyles.caption,
    color: '#666',
    marginBottom: 4,
  },
  overviewValue: {
    ...textStyles.h2,
    fontWeight: 'bold',
    color: '#333',
    // fontFamily: fonts.mono, - Removed as per design guidelines
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  overviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overviewFooterText: {
    ...textStyles.caption,
    color: '#666',
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
    ...textStyles.h2,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  budgetsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    ...textStyles.h2,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  budgetCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  budgetCardOver: {
    borderLeftColor: '#FF5252',
  },
  budgetCardNear: {
    borderLeftColor: '#FFC107',
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  budgetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  budgetIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  budgetInfo: {
    flex: 1,
  },
  budgetName: {
    ...textStyles.h2,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  budgetMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  budgetAmount: {
    ...textStyles.bodySmall,
    color: '#666',
    // fontFamily: fonts.mono, - Removed as per design guidelines
  },
  budgetCurrency: {
    ...textStyles.caption,
    color: '#999',
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,82,82,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  alertText: {
    ...textStyles.caption,
    color: '#FF5252',
    fontWeight: '600',
  },
  budgetActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editForm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editInput: {
    width: 80,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    ...textStyles.bodySmall,
    color: '#333',
  },
  saveEditButton: {
    backgroundColor: '#03A9F4',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  saveEditButtonText: {
    ...textStyles.caption,
    color: '#fff',
    fontWeight: '600',
  },
  actionButton: {
    padding: 8,
  },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  budgetFooterText: {
    ...textStyles.caption,
    color: '#666',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    ...textStyles.bodySmall,
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
    ...textStyles.h2,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    ...textStyles.bodySmall,
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
  modalItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalItemText: {
    ...textStyles.h2,
    color: '#333',
  },
  modalItemTextActive: {
    color: '#03A9F4',
    fontWeight: '600',
  },
  statsGrid: {
    gap: 12,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statsCard: {
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
  statsLabel: {
    textAlign: 'center',
    marginBottom: 4,
  },
  statsValue: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

