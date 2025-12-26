import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  RefreshControl,
  useWindowDimensions,
  Modal,
  Alert,
  ActivityIndicator,
  Image,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { fonts, textStyles as baseTextStyles, createResponsiveTextStyles } from '../constants/fonts';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  EyeOff,
  Bell,
  CreditCard,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle,
  Edit2,
  Trash2,
  PiggyBank,
} from 'lucide-react-native';
import { authService } from '../api/services/auth';
import { dashboardService } from '../api/services/dashboard';
import { transactionsService } from '../api/services/transactions';
import { recurringService } from '../api/services/recurring';
import { financialService, FinancialSummary } from '../api/services/financialService';
import { budgetsService } from '../api/services/budgets';
import { currenciesService } from '../api/services/currencies';
import { Currency } from '../api/types/category';
import { notificationsService } from '../api/services/notifications';
import { formatDateForDisplay } from '../api/utils/dateUtils';
import { translateCategoryName } from '../utils/categoryTranslator';
import { BarChart } from 'react-native-chart-kit';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useDeviceType, useResponsiveLayout } from '../hooks/useDeviceType';
import ResponsiveContainer, { ResponsiveGrid, ResponsiveRow, ResponsiveCard } from '../components/ResponsiveContainer';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  category: string; // Translated category name from backend
  original_category?: string; // Original English category name (for reference)
  description: string;
  date: string;
  convertedAmount?: number;
  defaultCurrency?: string;
  showConversion?: boolean;
}

interface UpcomingPayment {
  id: string;
  name: string;
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  dueDate: string;
  category: string; // Translated category name from backend
  original_category?: string; // Original English category name (for reference)
  convertedAmount?: number;
  defaultCurrency?: string;
  showConversion?: boolean;
}

interface Notification {
  id: string;
  type: 'payment' | 'budget' | 'achievement' | 'alert' | 'transaction';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface DashboardScreenProps {
  onViewAllTransactions?: () => void;
  onViewAllPayments?: () => void;
  onViewInbox?: () => void;
  onRenewLicense?: () => void;
  onEditTransaction?: (id: string) => void;
  onDeleteTransaction?: (id: string) => void;
}

export default function DashboardScreen({ 
  onViewAllTransactions, 
  onViewAllPayments,
  onViewInbox,
  onRenewLicense,
  onEditTransaction,
  onDeleteTransaction,
}: DashboardScreenProps = {}) {
  const { t, i18n } = useTranslation('common');
  const { width } = useWindowDimensions();
  const { isDark, colors } = useTheme();
  const { isTablet } = useDeviceType();
  const { padding, gap, columns, showSidebar } = useResponsiveLayout();
  const responsiveTextStyles = createResponsiveTextStyles(width);
  const [valuesHidden, setValuesHidden] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [licenseStatus, setLicenseStatus] = useState<'active' | 'expiring' | 'expired'>('active');
  const [daysRemaining, setDaysRemaining] = useState(0);
  
  // Dashboard data state
  const [totalBalance, setTotalBalance] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [savings, setSavings] = useState(0);
  const [currency, setCurrency] = useState('USD');
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [upcomingPayments, setUpcomingPayments] = useState<UpcomingPayment[]>([]);
  
  // Financial Health
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [loadingFinancial, setLoadingFinancial] = useState(false);
  
  // Budget
  const [monthlyBudgetTotal, setMonthlyBudgetTotal] = useState(0);
  const [monthlyBudgetSpent, setMonthlyBudgetSpent] = useState(0);
  const [monthlyBudgetRemaining, setMonthlyBudgetRemaining] = useState(0);
  const [budgetFromDate, setBudgetFromDate] = useState<string | null>(null);
  const [budgetToDate, setBudgetToDate] = useState<string | null>(null);
  
  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hoveredTransactionId, setHoveredTransactionId] = useState<string | null>(null);

  // Spending Ratio
  const [spendingRatio, setSpendingRatio] = useState(0);
  const [spendingRatioColor, setSpendingRatioColor] = useState('#4CAF50');

  // Budget
  const [hasBudget, setHasBudget] = useState(false);
  const [periodLabel, setPeriodLabel] = useState('Monthly Budget');
  const [budgetUsedPercentage, setBudgetUsedPercentage] = useState(0);
  const [isOverBudget, setIsOverBudget] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [i18n.language]); // Reload when language changes

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setLoadingFinancial(true);

      // Start fetching all independent data in parallel
      const [
        userData,
        currencies,
        summary,
        financial,
        budgetSummary,
        transactionsResponse,
        upcoming,
        notificationsResponse
      ] = await Promise.all([
        authService.getCurrentUser(),
        currenciesService.getCurrencies(),
        dashboardService.getSummary(),
        financialService.getSummary().catch(err => {
          console.error('Failed to load financial summary:', err);
          return null;
        }),
        budgetsService.getBudgetSummary().catch(err => {
          console.error('Failed to load budget summary:', err);
          return { totalBudget: 0, totalSpent: 0, remaining: 0 };
        }),
        transactionsService.getTransactions({ per_page: 10 }),
        recurringService.getUpcomingPayments(30),
        notificationsService.getNotifications({ per_page: 10 }).catch(err => {
          console.error('Failed to load notifications:', err);
          return { data: [] };
        })
      ]);

      // Process User
      setUser(userData);
      const defaultCurrency = userData.defaultCurrency || 'USD';
      setCurrency(defaultCurrency);

      // Process Currencies Map
      // Create a map for quick lookup - handle both camelCase and snake_case
      const currencyMap = new Map(currencies.map((c: any) => {
        // Handle both exchangeRate (camelCase) and exchange_rate (snake_case) from API
        // Use nullish coalescing to properly handle 0 values
        const rate = c.exchangeRate ?? c.exchange_rate ?? 1.0;
        // Validate rate
        if (rate === null || rate === undefined || !isFinite(rate) || rate < 0) {
          console.warn(`Invalid exchange rate for ${c.code}: ${rate}, using 1.0`);
          return [c.code, 1.0];
        }
        return [c.code, rate];
      }));

      // Check license status
      const licenseEndDate = userData.licenseEndDate || (userData as any).license_end_date;
      if (licenseEndDate) {
        const end = new Date(licenseEndDate);
        const now = new Date();
        const diffTime = end.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
          setLicenseStatus('expired');
        } else if (diffDays <= 7) {
          setLicenseStatus('expiring');
          setDaysRemaining(diffDays);
        } else {
          setLicenseStatus('active');
        }
      } else {
        setLicenseStatus('active');
      }

      // Process Dashboard Summary
      setTotalIncome(summary.totalIncome || 0);
      setTotalExpenses(summary.totalExpenses || 0);
      setSavings(summary.totalSavings || 0);
      setTotalBalance(summary.totalIncome - summary.totalExpenses);
      setBudgetFromDate(summary.fromDate || null);
      setBudgetToDate(summary.toDate || null);

      // Calculate spending ratio
      const ratio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;
      setSpendingRatio(ratio);
      const color = ratio > 100 ? '#FF5252' : '#4CAF50';
      setSpendingRatioColor(color);

      // Process Financial Summary
      if (financial) {
        setFinancialSummary(financial);
      }
      setLoadingFinancial(false);

      // Process Budget Summary
      if (budgetSummary) {
        const bs = budgetSummary as any;
        setMonthlyBudgetTotal(bs.totalBudget || bs.total_budget || 0);
        setMonthlyBudgetSpent(bs.totalSpent || bs.total_spent || 0);
        setMonthlyBudgetRemaining(bs.remaining || 0);
      }

      // Calculate budget metrics
      setHasBudget(monthlyBudgetTotal > 0);
      setBudgetUsedPercentage(monthlyBudgetTotal > 0 ? (monthlyBudgetSpent / monthlyBudgetTotal) * 100 : 0);
      setIsOverBudget(monthlyBudgetRemaining < 0);

      // Process Notifications
      if (notificationsResponse && notificationsResponse.data) {
        const notifs = notificationsResponse.data.map((n: any) => ({
          id: String(n.id),
          type: (n.type === 'recurring_payment' ? 'payment' : 
                 n.type === 'transaction_limit' ? 'alert' :
                 n.type === 'pro_expiration' ? 'alert' :
                 n.type === 'referral_reward' ? 'achievement' :
                 n.type === 'investment_reminder' ? 'transaction' : 'alert') as Notification['type'],
          title: n.title || '',
          message: n.message || '',
          time: n.createdAt || n.created_at || '',
          read: n.isRead ?? n.is_read ?? false,
        }));
        setNotifications(notifs);
        const unreadCount = notifs.filter(n => !n.read).length;
        setUnreadCount(unreadCount);
      }

      // Use currency from summary as the source of truth for conversion (exactly like SpendlyApp)
      const targetCurrency = summary.currency || defaultCurrency;
      
      // Ensure target currency exists in currencyMap (add with rate 1.0 if missing)
      if (!currencyMap.has(targetCurrency)) {
        console.warn(`Target currency ${targetCurrency} not found in currencyMap, adding with rate 1.0`);
        currencyMap.set(targetCurrency, 1.0);
      }
      
      // Debug: Log currency map for troubleshooting (first 5 entries)
      if (currencyMap.size > 0) {
        const sampleEntries = Array.from(currencyMap.entries()).slice(0, 5);
      }

      // Helper for conversion (exactly matching SpendlyApp logic)
      const convertToDefault = (amount: number, fromCurrency: string): number => {
        if (fromCurrency === targetCurrency) return amount;
        
        const fromRate = currencyMap.get(fromCurrency);
        const toRate = currencyMap.get(targetCurrency);
        
        // If rates are not available, log warning and return original amount
        if (fromRate === undefined || toRate === undefined) {
          console.warn(`Currency conversion: Missing rate for ${fromCurrency} (${fromRate}) or ${targetCurrency} (${toRate})`);
          console.warn('Available currencies:', Array.from(currencyMap.keys()));
          return amount;
        }
        
        // If fromRate is 0 or invalid, return original amount
        if (fromRate === 0 || !isFinite(fromRate)) {
          console.warn(`Currency conversion: Invalid fromRate (${fromRate}) for ${fromCurrency}`);
          return amount;
        }
        
        // If toRate is 0 or invalid, return original amount
        if (toRate === 0 || !isFinite(toRate)) {
          console.warn(`Currency conversion: Invalid toRate (${toRate}) for ${targetCurrency}`);
          return amount;
        }
        
        // Convert: (amount / fromRate) * toRate
        const converted = (amount / fromRate) * toRate;
        return isFinite(converted) ? converted : amount;
      };
      
      // Process Transactions
      if (transactionsResponse && transactionsResponse.data) {
        const transactions = transactionsResponse.data.map((tx: any) => {
          const dateStr = tx.date || tx.createdAt || new Date().toISOString();
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
            if (isDefaultCurrency) {
              convertedAmount = amount;
            } else {
              convertedAmount = convertToDefault(amount, txCurrency);
              // If conversion failed (returned original amount), don't show conversion
              if (convertedAmount === amount && txCurrency !== targetCurrency) {
                console.warn(`Failed to convert ${amount} ${txCurrency} to ${targetCurrency}`);
              }
            }
          }

          return {
            id: String(tx.id),
            type: tx.type as 'income' | 'expense',
            amount,
            currency: txCurrency,
            category: tx.category || tx.original_category || 'Uncategorized', // Use translated category from backend
            original_category: tx.original_category, // Preserve original for reference
            description: tx.notes || tx.description || 'Transaction',
            date: dateStr,
            convertedAmount,
            defaultCurrency: targetCurrency,
            showConversion: !isDefaultCurrency,
          };
        });
        setRecentTransactions(transactions);
      }
      
      // Process Upcoming Payments
      if (upcoming) {
        const payments = upcoming.map((p: any) => {
          // p.category should already be translated by backend, but preserve original_category
          const dateStr = p.dueDate || p.nextDueDate || new Date().toISOString();
          const paymentAmount = p.amount || 0;
          const paymentCurrency = p.currency || defaultCurrency;
          const isDefaultCurrency = paymentCurrency === targetCurrency;
          
          let convertedAmount: number;
          if (isDefaultCurrency) {
            convertedAmount = paymentAmount;
          } else {
            convertedAmount = convertToDefault(paymentAmount, paymentCurrency);
          }
          
          return {
            id: String(p.id),
            name: p.name || 'Recurring Payment',
            type: (p.type || 'expense') as 'income' | 'expense',
            amount: paymentAmount,
            currency: paymentCurrency,
            dueDate: formatDateForDisplay(dateStr, i18n.language),
            category: p.category || p.original_category || 'Uncategorized', // Use translated category from backend
            original_category: p.original_category, // Preserve original for reference
            convertedAmount,
            defaultCurrency: targetCurrency,
            showConversion: !isDefaultCurrency,
          };
        });
        setUpcomingPayments(payments);
      }
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
      setLoadingFinancial(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const formatValue = (value: number): string => {
    if (valuesHidden) {
      return '••••';
    }
    // Match Cordova: no decimal places on dashboard numbers
    return value.toLocaleString(i18n.language, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  // Format transaction amounts with decimals preserved
  const formatTransactionAmount = (value: number): string => {
    if (valuesHidden) {
      return '••••';
    }
    // Preserve decimal places for transaction amounts (e.g., 7.9 should show as 7.9, not 8)
    // Use minimumFractionDigits: 2 to ensure consistent display
    return value.toLocaleString(i18n.language, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Format payment amounts with decimals preserved
  const formatPaymentAmount = (value: number): string => {
    if (valuesHidden) {
      return '••••';
    }
    return value.toLocaleString(i18n.language, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatMoney = (amount: number): string => {
    if (valuesHidden) {
      return '••••';
    }
    // Explicit \"SGD 1000\" style: currency code + space + localized number with no decimals
    const numeric = amount.toLocaleString(i18n.language, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return `${currency} ${numeric}`;
  };

  const formatNotificationTime = (timeString: string): string => {
    if (!timeString) return t('inbox.justNow', { defaultValue: 'Just now' });
    try {
      const date = new Date(timeString);
      if (isNaN(date.getTime())) return timeString;
      
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (diffInSeconds < 60) return t('inbox.justNow', { defaultValue: 'Just now' });
      if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return t('inbox.minutesAgo', { count: minutes, defaultValue: `${minutes} minutes ago` });
      }
      if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return t('inbox.hoursAgo', { count: hours, defaultValue: `${hours} hours ago` });
      }
      if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return t('inbox.daysAgo', { count: days, defaultValue: `${days} days ago` });
      }
      return formatDateForDisplay(timeString, i18n.language);
    } catch {
      return timeString;
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsService.markAsRead(Number(id));
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      console.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  if (loading) {
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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: isTablet ? padding : 16, paddingBottom: isTablet ? 40 : 32 }
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          {/* Only show logo when sidebar is not visible */}
          {!showSidebar && (
            <View style={styles.headerLogoContainer}>
              <Image
                source={require('../../assets/logo-dark.png')}
                style={styles.headerLogo}
                resizeMode="contain"
              />
              <Text style={[styles.headerSubtitle, responsiveTextStyles.caption, { color: colors.mutedForeground }]}>
                {t('footer.tagline') || 'Track. Save. Grow.'}
              </Text>
            </View>
          )}
          <View style={[styles.headerActions, showSidebar && { flex: 1, justifyContent: 'flex-end' }]}>
            <Pressable
              onPress={() => setValuesHidden(!valuesHidden)}
              style={({ pressed }) => [styles.eyeButton, { opacity: pressed ? 0.7 : 1 }]}
            >
              {valuesHidden ? <EyeOff size={20} color={colors.foreground} /> : <Eye size={20} color={colors.foreground} />}
            </Pressable>
            <Pressable
              onPress={() => onViewInbox ? onViewInbox() : setShowNotifications(true)}
              style={({ pressed }) => [styles.bellButton, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Bell size={20} color={colors.foreground} />
              {unreadCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {/* Balance Overview Card - Full Width */}
        <LinearGradient
          colors={['#03A9F4', '#0288D1']}
          style={[styles.balanceCard, isTablet && { padding: 24 }]}
        >
          <View style={styles.balanceHeader}>
            <Wallet size={16} color="rgba(255,255,255,0.9)" />
            <Text style={[styles.balanceLabel, responsiveTextStyles.caption]}>
              {t('dashboard.totalBalance') || 'Total Balance'}
            </Text>
          </View>
          <View style={styles.balanceAmountContainer}>
            {!valuesHidden && <Text style={[styles.balanceCurrency, responsiveTextStyles.caption]}>{currency}{' '}</Text>}
            <Text style={[styles.balanceAmount, responsiveTextStyles.displaySmall]}>{formatValue(totalBalance)}</Text>
          </View>
          <View style={[styles.balanceStats, isTablet && { gap: 20 }]}>
            <View style={[styles.balanceStatItem, isTablet && { padding: 16 }]}>
              <View style={styles.balanceStatHeader}>
                <ArrowUpRight size={14} color="rgba(255,255,255,0.9)" />
                <Text style={[styles.balanceStatLabel, responsiveTextStyles.caption]}>{t('dashboard.income') || 'Income'}</Text>
              </View>
              <View style={styles.balanceStatValueContainer}>
                {!valuesHidden && <Text style={[styles.balanceStatCurrency, responsiveTextStyles.caption]}>{currency}{' '}</Text>}
                <Text style={[styles.balanceStatValue, responsiveTextStyles.bodySmall]}>{formatValue(totalIncome)}</Text>
              </View>
            </View>
            <View style={[styles.balanceStatItem, isTablet && { padding: 16 }]}>
              <View style={styles.balanceStatHeader}>
                <ArrowDownRight size={14} color="rgba(255,255,255,0.9)" />
                <Text style={[styles.balanceStatLabel, responsiveTextStyles.caption]}>{t('dashboard.expenses') || 'Expenses'}</Text>
              </View>
              <View style={styles.balanceStatValueContainer}>
                {!valuesHidden && <Text style={[styles.balanceStatCurrency, responsiveTextStyles.caption]}>{currency}{' '}</Text>}
                <Text style={[styles.balanceStatValue, responsiveTextStyles.bodySmall]}>{formatValue(totalExpenses)}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Financial Health and Quick Stats - Side by side on iPad */}
        <View style={[{ marginBottom: 16 }, isTablet && { flexDirection: 'row', gap: gap }]}>
          {/* Financial Health */}
          {financialSummary && (
            <View style={[styles.cardContainer, { flex: isTablet ? 1 : undefined, backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.financialHealthHeader}>
                <Text style={[responsiveTextStyles.h4, { color: colors.foreground }]}>
                  {t('dashboard.financialHealth') || 'Financial Health'}
                </Text>
                <View style={[
                  styles.netWorthBadge,
                  { backgroundColor: (financialSummary.netWorth ?? financialSummary.net_worth ?? 0) >= 0 ? 'rgba(76,175,80,0.1)' : 'rgba(255,82,82,0.1)' }
                ]}>
                  <Text style={[
                    styles.netWorthText,
                    { color: (financialSummary.netWorth ?? financialSummary.net_worth ?? 0) >= 0 ? '#4CAF50' : '#FF5252' }
                  ]}>
                    {`${t('dashboard.netWorth') || 'Net Worth:'} ${formatMoney(financialSummary.netWorth ?? financialSummary.net_worth ?? 0)}`}
                  </Text>
                </View>
              </View>
              <View style={[{ gap: 12 }, isTablet && { flexDirection: 'row' }]}>
                {/* Total Assets Card */}
                <View style={[
                  styles.assetCard,
                  isTablet && { flex: 1 },
                  {
                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(209, 250, 229, 1)',
                    borderColor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(209, 250, 229, 1)',
                  }
                ]}>
                  <View style={styles.assetHeader}>
                    <View style={[
                      styles.assetIconContainer,
                      { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(209, 250, 229, 1)' }
                    ]}>
                      <TrendingUp size={16} color={isDark ? '#34D399' : '#059669'} />
                    </View>
                    <Text style={[styles.assetLabel, responsiveTextStyles.caption, { color: isDark ? '#A7F3D0' : '#064E3B' }]}>
                      {t('dashboard.totalAssets') || 'Total Assets'}
                    </Text>
                  </View>
                  <Text style={[styles.assetValue, responsiveTextStyles.h4, { color: isDark ? '#6EE7B7' : '#047857' }]}>
                    {formatMoney(financialSummary.totalAssets ?? financialSummary.total_assets ?? 0)}
                  </Text>
                </View>

                {/* Total Liabilities Card */}
                <View style={[
                  styles.assetCard,
                  isTablet && { flex: 1 },
                  {
                    backgroundColor: isDark ? 'rgba(225, 29, 72, 0.1)' : 'rgba(255, 228, 230, 1)',
                    borderColor: isDark ? 'rgba(225, 29, 72, 0.2)' : 'rgba(255, 228, 230, 1)',
                  }
                ]}>
                  <View style={styles.assetHeader}>
                    <View style={[
                      styles.assetIconContainer,
                      { backgroundColor: isDark ? 'rgba(225, 29, 72, 0.3)' : 'rgba(255, 228, 230, 1)' }
                    ]}>
                      <TrendingDown size={16} color={isDark ? '#FB7185' : '#E11D48'} />
                    </View>
                    <Text style={[styles.assetLabel, responsiveTextStyles.caption, { color: isDark ? '#FECDD3' : '#9F1239' }]}>
                      {t('dashboard.totalLiabilities') || 'Total Liabilities'}
                    </Text>
                  </View>
                  <Text style={[styles.assetValue, responsiveTextStyles.h4, { color: isDark ? '#FDA4AF' : '#BE123C' }]}>
                    {formatMoney(financialSummary.totalLiabilities ?? financialSummary.total_liabilities ?? 0)}
                  </Text>
                </View>
              </View>
              
              {/* Active Loans */}
              {financialSummary.liabilities && financialSummary.liabilities.length > 0 && (
                <View style={styles.loansSection}>
                  <Text style={[styles.loansTitle, { color: colors.foreground }]}>
                    {t('dashboard.activeLoans') || 'Active Loans'}
                  </Text>
                  {financialSummary.liabilities.map((loan: any) => (
                    <View
                      key={loan.id}
                      style={[
                        styles.loanCard,
                        { backgroundColor: colors.card, borderColor: colors.border }
                      ]}
                    >
                      <View style={styles.loanHeader}>
                        <View style={styles.loanIconContainer}>
                          <CreditCard size={16} color="#03A9F4" />
                        </View>
                        <View style={styles.loanInfo}>
                          <Text style={[styles.loanDescription, { color: colors.foreground }]}>
                            {loan.description}
                          </Text>
                          <Text style={[styles.loanMeta, { color: colors.mutedForeground }]}>
                            {loan.type} {t('dashboard.loan') || 'Loan'} • {t('dashboard.ends')} {formatDateForDisplay(loan.endDate ?? loan.end_date ?? '', i18n.language)}
                          </Text>
                        </View>
                        <View style={styles.loanAmount}>
                          <Text style={[styles.loanAmountText, { color: colors.foreground }]}>
                            {formatMoney(loan.remainingAmount ?? loan.remaining_amount ?? 0)}
                          </Text>
                          <Text style={[styles.loanAmountSubtext, { color: colors.mutedForeground }]}>
                            {t('dashboard.of') || 'of'} {formatMoney(loan.amount)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.loanProgress}>
                        <View style={styles.loanProgressInfo}>
                          <Text style={[styles.loanProgressText, { color: colors.mutedForeground }]}>
                            {Math.round(loan.progress)}% {t('dashboard.paid') || 'Paid'}
                          </Text>
                          <Text style={[styles.loanProgressText, { color: colors.mutedForeground }]}>
                            {formatMoney(loan.paidAmount ?? loan.paid_amount ?? 0)} {t('dashboard.paid') || 'paid'}
                          </Text>
                        </View>
                        <View style={styles.loanProgressBar}>
                          <View
                            style={[
                              styles.loanProgressFill,
                              { width: `${Math.min(loan.progress, 100)}%` }
                            ]}
                          />
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Quick Stats */}
          <View style={[styles.cardContainer, { flex: isTablet ? 1 : undefined, backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={[styles.statCard, { flex: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }]}>
                <View style={styles.statHeader}>
                  <Text style={[styles.statLabel, responsiveTextStyles.caption, { color: colors.mutedForeground }]}>
                    {t('dashboard.savings') || 'Savings'}
                  </Text>
                  <TrendingUp size={16} color="#4CAF50" />
                </View>
                <View style={styles.statValueContainer}>
                  {!valuesHidden && (
                    <Text style={[styles.statCurrency, responsiveTextStyles.caption, { color: colors.mutedForeground }]}>
                      {currency}
                    </Text>
                  )}
                  <Text style={[styles.statValue, responsiveTextStyles.bodySmall, { color: colors.foreground }]}>
                    {formatValue(savings)}
                  </Text>
                </View>
              </View>
              <View style={[styles.statCard, { flex: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }]}>
                <View style={styles.statHeader}>
                  <Text style={[styles.statLabel, responsiveTextStyles.caption, { color: colors.mutedForeground }]}>
                    {t('dashboard.spendingRatio') || 'Spending Ratio'}
                  </Text>
                  <TrendingDown size={16} color={spendingRatioColor} />
                </View>
                <View style={styles.statValueContainer}>
                  {totalIncome > 0 ? (
                    <>
                      <Text style={[styles.statValue, responsiveTextStyles.bodySmall, { color: spendingRatioColor }]}>
                        {spendingRatio.toFixed(1)}%
                      </Text>
                      {!valuesHidden && (
                        <Text style={[styles.statRatioText, responsiveTextStyles.caption, { color: colors.mutedForeground }]}>
                          {t('dashboard.ofIncome') || 'of income'}
                        </Text>
                      )}
                    </>
                  ) : (
                    <Text style={[styles.statValue, responsiveTextStyles.bodySmall, { color: colors.mutedForeground }]}>
                      N/A
                    </Text>
                  )}
                </View>
                {totalIncome > 0 && (
                  <View style={[styles.progressBar, { backgroundColor: '#e0e0e0' }]}>
                    <View style={[styles.progressFill, { width: `${Math.min(spendingRatio, 100)}%`, backgroundColor: spendingRatioColor, height: 6 }]} />
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Monthly Budget Overview */}
        {hasBudget && (
          <View style={[styles.cardContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.budgetHeader}>
              <View style={styles.budgetTitleRow}>
                <PiggyBank size={20} color="#03A9F4" />
                <Text style={[styles.budgetLabel, responsiveTextStyles.bodySmall, { color: colors.foreground, fontWeight: '600' }]}>
                  {periodLabel}
                </Text>
              </View>
              <View style={styles.budgetSummaryRow}>
                <View style={styles.budgetSummaryItem}>
                  <Text style={[styles.budgetSummaryLabel, responsiveTextStyles.caption, { color: colors.mutedForeground }]}>
                    {t('dashboard.totalBudget') || 'Total Budget'}
                  </Text>
                  <View style={styles.budgetAmountRow}>
                    {!valuesHidden && (
                      <Text style={[styles.budgetCurrency, responsiveTextStyles.caption, { color: colors.mutedForeground }]}>
                        {currency}{' '}
                      </Text>
                    )}
                    <Text style={[styles.budgetTotal, responsiveTextStyles.h4, { color: colors.foreground, fontWeight: '700' }]}>
                      {formatValue(monthlyBudgetTotal)}
                    </Text>
                  </View>
                </View>
                <View style={[styles.budgetDivider, { backgroundColor: colors.border }]} />
                <View style={styles.budgetSummaryItem}>
                  <Text style={[styles.budgetSummaryLabel, responsiveTextStyles.caption, { color: colors.mutedForeground }]}>
                    {t('dashboard.spent') || 'Spent'}
                  </Text>
                  <View style={styles.budgetAmountRow}>
                    {!valuesHidden && (
                      <Text style={[styles.budgetCurrency, responsiveTextStyles.caption, { color: colors.mutedForeground }]}>
                        {currency}{' '}
                      </Text>
                    )}
                    <Text style={[
                      styles.budgetSpentValue,
                      responsiveTextStyles.h4,
                      { color: isOverBudget ? colors.destructive : colors.foreground, fontWeight: '700' }
                    ]}>
                      {formatValue(monthlyBudgetSpent)}
                    </Text>
                  </View>
                </View>
                <View style={[styles.budgetDivider, { backgroundColor: colors.border }]} />
                <View style={styles.budgetSummaryItem}>
                  <Text style={[styles.budgetSummaryLabel, responsiveTextStyles.caption, { color: colors.mutedForeground }]}>
                    {isOverBudget ? (t('dashboard.over') || 'Over') : (t('dashboard.left') || 'Left')}
                  </Text>
                  <View style={styles.budgetAmountRow}>
                    {!valuesHidden && (
                      <Text style={[styles.budgetCurrency, responsiveTextStyles.caption, { color: colors.mutedForeground }]}>
                        {currency}{' '}
                      </Text>
                    )}
                    <Text style={[
                      styles.budgetTotal, 
                      responsiveTextStyles.h4, 
                      { color: isOverBudget ? colors.destructive : colors.success, fontWeight: '700' }
                    ]}>
                      {valuesHidden ? '••••' : formatValue(Math.abs(monthlyBudgetRemaining))}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.budgetProgressRow}>
                <View style={[styles.budgetProgressBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#e0e0e0', flex: 1 }]}>
                  <View
                    style={[
                      styles.budgetProgressFill,
                      {
                        width: `${budgetUsedPercentage}%`,
                        backgroundColor: isOverBudget ? '#FF5252' : budgetUsedPercentage >= 80 ? '#FF9800' : '#03A9F4',
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.budgetPercentage, responsiveTextStyles.caption, { color: colors.mutedForeground, marginLeft: 10 }]}>
                  {budgetUsedPercentage.toFixed(0)}% {t('dashboard.used') || 'used'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Income vs Expense Chart */}
        <View style={[styles.cardContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.chartTitleContainer}>
            <Text style={[styles.chartTitle, responsiveTextStyles.h4, { color: colors.foreground }]}>
              {t('dashboard.incomeVsExpenses') || 'Income vs Expenses'}
            </Text>
          </View>
          <View style={styles.chartContainer}>
            <BarChart
              data={{
                labels: [t('dashboard.income') || 'Income', t('dashboard.expenses') || 'Expenses'],
                datasets: [{
                  data: [totalIncome, totalExpenses]
                }]
              }}
              width={width - (isTablet ? padding * 2 : 32)}
              height={220}
              yAxisLabel={valuesHidden ? '••••' : currency}
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: colors.card,
                backgroundGradientFrom: colors.card,
                backgroundGradientTo: colors.card,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(3, 169, 244, ${opacity})`,
                labelColor: (opacity = 1) => colors.foreground,
                style: {
                  borderRadius: 16,
                },
                propsForBackgroundLines: {
                  strokeWidth: 1,
                  stroke: colors.border,
                  strokeDasharray: '',
                },
                propsForLabels: {
                  fontFamily: fonts.sans,
                },
                formatYLabel: (value) => valuesHidden ? '••••' : formatValue(parseFloat(value)),
                fillShadowGradientFrom: '#4CAF50',
                fillShadowGradientTo: '#FF5252',
                fillShadowGradientFromOpacity: 0.8,
                fillShadowGradientToOpacity: 0.8,
                barPercentage: 0.7,
                propsForVerticalLabels: {
                  rotation: 0,
                  fontSize: 12,
                  fontFamily: fonts.sans,
                },
                propsForHorizontalLabels: {
                  fontSize: 12,
                  fontFamily: fonts.sans,
                },
              }}
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
              showBarTops={false}
              showValuesOnTopOfBars={true}
              fromZero={true}
              withHorizontalLabels={true}
              withVerticalLabels={true}
              withInnerLines={true}
              segments={4}
            />
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
                <Text style={[styles.legendText, { color: colors.foreground }]}>
                  {t('dashboard.income') || 'Income'}: {valuesHidden ? '••••' : `${currency} ${formatValue(totalIncome)}`}
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#FF5252' }]} />
                <Text style={[styles.legendText, { color: colors.foreground }]}>
                  {t('dashboard.expenses') || 'Expenses'}: {valuesHidden ? '••••' : `${currency} ${formatValue(totalExpenses)}`}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Upcoming Payments */}
        {upcomingPayments.length > 0 && (
          <View style={[styles.cardContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, responsiveTextStyles.h4, { color: colors.foreground }]}>
                {t('dashboard.upcomingPayments') || 'Upcoming Payments'}
              </Text>
              {onViewAllPayments && (
                <Pressable onPress={onViewAllPayments}>
                  <Text style={[styles.sectionLink, responsiveTextStyles.caption, { color: colors.primary }]}>
                    {t('dashboard.viewAll') || 'View All'}
                  </Text>
                </Pressable>
              )}
            </View>
            <View style={{ gap: 12 }}>
              {upcomingPayments.slice(0, 3).map((payment: any) => (
                <View 
                  key={payment.id} 
                  style={[
                    styles.paymentCard, 
                    { 
                      backgroundColor: colors.card,
                      borderLeftWidth: 4,
                      borderLeftColor: payment.type === 'income' ? '#4CAF50' : '#FFC107',
                      borderColor: colors.border,
                    }
                  ]}
                >
                  <View style={styles.paymentContent}>
                    <View
                      style={[
                        styles.paymentIcon,
                        {
                          backgroundColor:
                            payment.type === 'income' ? 'rgba(76,175,80,0.1)' : 'rgba(255,193,7,0.1)',
                        },
                      ]}
                    >
                      {payment.type === 'income' ? (
                        <ArrowUpRight size={16} color="#4CAF50" />
                      ) : (
                        <Calendar size={16} color="#FFC107" />
                      )}
                    </View>
                    <View style={styles.paymentInfo}>
                      <Text style={[styles.paymentName, responsiveTextStyles.caption, { color: colors.foreground }]}>
                        {payment.name}
                      </Text>
                      <View style={styles.paymentMetaRow}>
                        <View style={[
                          styles.paymentTypeBadge,
                          {
                            backgroundColor: payment.type === 'income' ? 'rgba(76,175,80,0.1)' : 'rgba(255,193,7,0.1)',
                          }
                        ]}>
                          <Text style={[
                            styles.paymentTypeBadgeText,
                            { color: payment.type === 'income' ? '#4CAF50' : '#FFC107' }
                          ]}>
                            {payment.type === 'income' ? t('dashboard.income') : t('dashboard.expense')}
                          </Text>
                        </View>
                        <Text style={[styles.paymentMetaText, responsiveTextStyles.small, { color: colors.mutedForeground }]}>
                          {translateCategoryName(payment.category, t, (payment as any).original_category)}
                        </Text>
                        <Text style={[styles.paymentMetaDot, { color: colors.mutedForeground }]}>•</Text>
                        <Text style={[
                          styles.paymentMetaText,
                          responsiveTextStyles.small,
                          { color: payment.type === 'income' ? '#4CAF50' : '#FFC107' }
                        ]}>
                          {formatDateForDisplay(payment.dueDate, i18n.language)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.paymentAmountContainer}>
                      <View>
                        <Text
                          style={[
                            styles.paymentAmount,
                            responsiveTextStyles.caption,
                            { color: payment.type === 'income' ? '#4CAF50' : colors.foreground },
                          ]}
                        >
                          {valuesHidden ? '••••' : `${payment.currency} ${formatPaymentAmount(payment.amount)}`}
                        </Text>
                        {!valuesHidden &&
                          payment.showConversion &&
                          payment.convertedAmount !== undefined && (
                            <Text
                              style={[
                                styles.paymentCurrency,
                                responsiveTextStyles.small,
                                {
                                  color: colors.mutedForeground,
                                  fontWeight: '500',
                                },
                              ]}
                            >
                              ≈ {payment.defaultCurrency} {payment.convertedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </Text>
                          )}
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recent Transactions */}
        <View style={[styles.cardContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, responsiveTextStyles.h4, { color: colors.foreground }]}>
              {t('dashboard.recentTransactions') || 'Recent Transactions'}
            </Text>
            {onViewAllTransactions && recentTransactions.length > 0 && (
              <Pressable onPress={onViewAllTransactions}>
                <Text style={[styles.sectionLink, responsiveTextStyles.caption, { color: colors.primary }]}>
                  {t('dashboard.viewAll')}
                </Text>
              </Pressable>
            )}
          </View>
          {recentTransactions.length > 0 ? (
            <View style={[styles.transactionsContainer, { backgroundColor: colors.card, borderRadius: 12 }]}>
              {recentTransactions.slice(0, 5).map((transaction: any, index: number) => (
                <Pressable
                  key={transaction.id}
                  onHoverIn={() => setHoveredTransactionId(transaction.id)}
                  onHoverOut={() =>
                    setHoveredTransactionId((current) => (current === transaction.id ? null : current))
                  }
                  onPress={() =>
                    setHoveredTransactionId((current) => (current === transaction.id ? null : transaction.id))
                  }
                  style={({ pressed }) => [
                    styles.transactionCard,
                    {
                      backgroundColor: colors.card,
                      borderBottomWidth:
                        index < recentTransactions.slice(0, 5).length - 1 ? 1 : 0,
                      borderBottomColor: colors.border,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <View style={styles.transactionContent}>
                    <View
                      style={[
                        styles.transactionIcon,
                        {
                          backgroundColor:
                            transaction.type === 'income' ? 'rgba(76,175,80,0.1)' : 'rgba(255,82,82,0.1)',
                        },
                      ]}
                    >
                      {transaction.type === 'income' ? (
                        <ArrowUpRight size={16} color="#4CAF50" />
                      ) : (
                        <ArrowDownRight size={16} color="#FF5252" />
                      )}
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={[styles.transactionDescription, responsiveTextStyles.caption, { color: colors.foreground }]}>
                        {transaction.description}
                      </Text>
                      <View style={styles.transactionMetaRow}>
                        <Text style={[styles.transactionMetaText, responsiveTextStyles.small, { color: colors.mutedForeground }]}>
                          {translateCategoryName(transaction.category, t, (transaction as any).original_category)}
                        </Text>
                        <Text style={[styles.transactionMetaDot, { color: colors.mutedForeground }]}>•</Text>
                        <Text style={[styles.transactionMetaText, responsiveTextStyles.small, { color: colors.mutedForeground }]}>
                          {formatDateForDisplay(transaction.date, i18n.language)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.transactionAmountContainer}>
                      <View style={styles.transactionAmountColumn}>
                        <Text
                          style={[
                            styles.transactionAmount,
                            responsiveTextStyles.caption,
                            { color: transaction.type === 'income' ? '#4CAF50' : '#FF5252' },
                          ]}
                        >
                          {valuesHidden
                            ? '••••'
                            : `${transaction.type === 'income' ? '+' : '-'}${transaction.currency} ${formatTransactionAmount(transaction.amount)}`}
                        </Text>
                        {!valuesHidden &&
                          transaction.showConversion &&
                          transaction.convertedAmount !== undefined && (
                            <Text
                              style={[
                                styles.transactionCurrency,
                                responsiveTextStyles.small,
                                {
                                  color: colors.mutedForeground,
                                  fontWeight: '500',
                                },
                              ]}
                            >
                              ≈ {transaction.defaultCurrency} {transaction.convertedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </Text>
                          )}
                      </View>
                      {hoveredTransactionId === transaction.id && (
                        <View style={styles.transactionActions}>
                          <Pressable
                            style={styles.transactionActionButton}
                            onPress={() => {
                              onEditTransaction && onEditTransaction(transaction.id);
                            }}
                          >
                            <Edit2 size={16} color={colors.mutedForeground} />
                          </Pressable>
                          <Pressable
                            style={styles.transactionActionButton}
                            onPress={() => {
                              onDeleteTransaction && onDeleteTransaction(transaction.id);
                            }}
                          >
                            <Trash2 size={16} color={colors.destructive} />
                          </Pressable>
                        </View>
                      )}
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={[styles.emptyStateCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.emptyStateText, { color: colors.mutedForeground }]}>
                {t('dashboard.noTransactions') || 'No transactions yet'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Notifications Modal */}
      <Modal
        visible={showNotifications}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNotifications(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('inbox.notifications', { defaultValue: 'Notifications' })}</Text>
              <View style={styles.modalActions}>
                {unreadCount > 0 && (
                  <Pressable onPress={handleMarkAllAsRead} style={styles.markAllButton}>
                    <Text style={[styles.markAllText, { color: colors.primary }]}>
                      {t('inbox.markAllAsRead', { defaultValue: 'Mark all as read' })}
                    </Text>
                  </Pressable>
                )}
                <Pressable onPress={() => setShowNotifications(false)} style={styles.closeButton}>
                  <Text style={[styles.closeButtonText, { color: colors.foreground }]}>✕</Text>
                </Pressable>
              </View>
            </View>
            <ScrollView style={styles.notificationsList}>
              {notifications.length > 0 ? (
                notifications.map((notification: any) => (
                  <Pressable
                    key={notification.id}
                    style={[
                      styles.notificationItem,
                      { 
                        backgroundColor: !notification.read ? colors.accent : colors.card,
                        borderBottomColor: colors.border,
                      },
                    ]}
                    onPress={() => handleMarkAsRead(notification.id)}
                  >
                    <View style={[styles.notificationIcon, { backgroundColor: colors.muted }]}>
                      {notification.type === 'payment' && <Calendar size={20} color="#FFC107" />}
                      {notification.type === 'budget' && <AlertCircle size={20} color="#FF5252" />}
                      {notification.type === 'achievement' && <TrendingUp size={20} color="#4CAF50" />}
                      {notification.type === 'alert' && <AlertCircle size={20} color="#FF9800" />}
                      {notification.type === 'transaction' && <DollarSign size={20} color="#03A9F4" />}
                    </View>
                    <View style={styles.notificationContent}>
                      <Text style={[styles.notificationTitle, { color: colors.foreground }]}>
                        {notification.title}
                      </Text>
                      <Text style={[styles.notificationMessage, { color: colors.mutedForeground }]}>
                        {notification.message}
                      </Text>
                      <Text style={[styles.notificationTime, { color: colors.mutedForeground }]}>
                        {formatNotificationTime(notification.time)}
                      </Text>
                    </View>
                    {!notification.read && (
                      <View style={[styles.notificationDot, { backgroundColor: colors.primary }]} />
                    )}
                  </Pressable>
                ))
              ) : (
                <View style={styles.emptyNotifications}>
                  <Text style={[styles.emptyNotificationsText, { color: colors.mutedForeground }]}>
                    {t('inbox.noNotifications', { defaultValue: 'No notifications yet' })}
                  </Text>
                </View>
              )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  licenseBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  licenseBannerText: {
    fontFamily: fonts.sans,
    flex: 1,
    fontWeight: '500',
    marginRight: 12,
  },
  renewButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  renewButtonText: {
    fontFamily: fonts.sans,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24, // space-y-6 (24px)
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  headerLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLogo: {
    width: 56,
    height: 56,
  },
  headerTitle: {
    ...baseTextStyles.h3,
    marginBottom: 2, // mt-0.5 equivalent
  },
  headerSubtitle: {
    ...baseTextStyles.caption,
    lineHeight: 16,
  },
  eyeButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bellButton: {
    padding: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF5252',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    ...baseTextStyles.small,
    color: '#fff',
    fontWeight: 'bold',
  },
  balanceCard: {
    borderRadius: 12,
    padding: 16, // p-4 sm:p-6 (16px base, 24px larger)
    marginBottom: 24, // space-y-6 (24px)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  balanceLabel: {
    ...baseTextStyles.caption,
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.5, // tracking-wide
  },
  balanceAmountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16, // mb-4 sm:mb-6 (16px base, 24px larger)
  },
  balanceCurrency: {
    ...baseTextStyles.caption,
    color: 'rgba(255,255,255,0.8)',
  },
  balanceAmount: {
    ...baseTextStyles.displaySmall,
    fontFamily: fonts.sans,
    color: '#fff',
  },
  balanceStats: {
    flexDirection: 'row',
    gap: 12,
  },
  balanceStatItem: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 10, // p-2.5 sm:p-3 (10px base, 12px larger)
  },
  balanceStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  balanceStatLabel: {
    fontFamily: fonts.sans,
    color: 'rgba(255,255,255,0.8)',
    opacity: 0.8,
  },
  balanceStatValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  balanceStatCurrency: {
    color: 'rgba(255,255,255,0.8)',
  },
  balanceStatValue: {
    fontWeight: '600',
    color: '#fff',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12, // p-3 sm:p-4 (12px base, 16px larger)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8, // mb-2 (8px)
  },
  statLabel: {
    fontFamily: fonts.sans,
    flex: 1,
  },
  statValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  statCurrency: {
    marginRight: 4,
    color: '#333',
  },
  statValue: {
    fontWeight: 'bold',
  },
  statRatioText: {
    fontFamily: fonts.sans,
    marginLeft: 4,
  },
  progressBar: {
    height: 6, // h-1.5 (6px)
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 8, // mt-2 (8px)
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  section: {
    marginBottom: 24, // space-y-6 (24px)
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12, // mb-3 (12px)
  },
  sectionTitle: {
    ...baseTextStyles.h4,
  },
  sectionLink: {
    fontFamily: fonts.sans,
    fontWeight: '500',
  },
  paymentCard: {
    borderRadius: 12,
    padding: 12, // p-3 sm:p-4 (12px base, 16px larger)
    marginBottom: 0, // No margin, using gap in parent
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  paymentContent: {
    flexDirection: 'row',
    alignItems: 'flex-start', // items-start sm:items-center
    gap: 8, // gap-2 sm:gap-3 (8px base, 12px larger)
    flex: 1,
  },
  paymentIcon: {
    width: 32, // w-8 h-8 sm:w-10 sm:h-10 (32px base, 40px larger)
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  paymentInfo: {
    flex: 1,
    minWidth: 0, // min-w-0 equivalent
  },
  paymentName: {
    fontFamily: fonts.sans,
    fontWeight: '500', // font-medium
    marginBottom: 4, // mt-1 (4px)
  },
  paymentMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4, // gap-1 sm:gap-2 (4px base, 8px larger)
    marginTop: 4, // mt-1 (4px)
  },
  paymentTypeBadge: {
    paddingHorizontal: 6, // px-1.5 sm:px-2 (6px base, 8px larger)
    paddingVertical: 2, // py-0.5 (2px)
    borderRadius: 12, // rounded-full
  },
  paymentTypeBadgeText: {
    ...baseTextStyles.small,
    fontWeight: '500',
  },
  paymentMetaText: {
    ...baseTextStyles.small,
  },
  paymentMetaDot: {
    ...baseTextStyles.small,
    marginHorizontal: 2,
  },
  paymentAmountContainer: {
    alignItems: 'flex-end', // text-right
    flexShrink: 0,
  },
  paymentAmount: {
    fontWeight: '500',
    textAlign: 'right',
  },
  paymentCurrency: {
    ...baseTextStyles.small,
    marginTop: 2, // mt-0.5 (2px)
    textAlign: 'right',
  },
  transactionsContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    marginTop: 4,
  },
  transactionCard: {
    paddingVertical: 16, // taller cards like web
    paddingHorizontal: 16,
    borderBottomWidth: 1, // divide-y equivalent
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'flex-start', // items-start sm:items-center
    gap: 8, // gap-2 sm:gap-3 (8px base, 12px larger)
    flex: 1,
  },
  transactionIcon: {
    width: 32, // w-8 h-8 sm:w-10 sm:h-10 (32px base, 40px larger)
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  transactionInfo: {
    flex: 1,
    minWidth: 0, // min-w-0 equivalent
  },
  transactionDescription: {
    fontFamily: fonts.sans,
    fontWeight: '600', // a bit bolder
    marginBottom: 6, // slightly more space
  },
  transactionMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6, // a bit more breathing room
    marginTop: 6, // mt-1.5 (6px)
  },
  transactionMetaText: {
    ...baseTextStyles.small,
  },
  transactionMetaDot: {
    ...baseTextStyles.small,
    marginHorizontal: 2,
  },
  transactionAmountContainer: {
    alignItems: 'flex-end', // text-right
    flexShrink: 0,
    flexDirection: 'row',
    gap: 8,
  },
  transactionAmountColumn: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontWeight: '500',
    textAlign: 'right',
  },
  transactionCurrency: {
    ...baseTextStyles.small,
    marginTop: 2, // mt-0.5 (2px)
    textAlign: 'right',
  },
  transactionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  transactionActionButton: {
    padding: 4,
    borderRadius: 999,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateCard: {
    borderRadius: 12,
    padding: 32, // p-8 (32px)
    alignItems: 'center',
    backgroundColor: '#fff', // Will be overridden by theme
  },
  emptyStateText: {
    ...baseTextStyles.bodySmall,
    textAlign: 'center',
  },
  financialHealthCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24, // space-y-6 (24px)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  financialHealthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16, // space-y-4 sm:space-y-6 (16px base, 24px larger)
    flexWrap: 'wrap',
    gap: 8, // gap-2 sm:gap-0 (8px base, 0px larger)
  },
  financialHealthTitle: {
    ...baseTextStyles.h3,
    fontWeight: '600', // font-semibold
  },
  netWorthBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  netWorthText: {
    ...baseTextStyles.caption,
    fontWeight: '600',
  },
  assetsLiabilitiesRow: {
    // flexDirection handled by ResponsiveRow
    // gap handled by ResponsiveRow
    marginBottom: 0, // No margin, spacing handled by parent
  },
  assetCard: {
    width: '100%', // Full width when stacked
    borderRadius: 12, // rounded-xl
    padding: 12, // p-3 sm:p-4 (12px base, 16px larger)
    borderWidth: 1,
  },
  assetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // gap-2 sm:gap-3 (8px base, 12px larger)
    marginBottom: 8, // mb-2 (8px)
  },
  assetIconContainer: {
    padding: 6, // p-1.5 sm:p-2 (6px base, 8px larger)
    borderRadius: 8, // rounded-lg
    justifyContent: 'center',
    alignItems: 'center',
  },
  assetLabel: {
    fontFamily: fonts.sans,
    flex: 1,
    fontWeight: '500', // font-medium
  },
  assetValue: {
    fontWeight: 'bold', // font-bold
  },
  loansSection: {
    marginTop: 16,
  },
  loansTitle: {
    ...baseTextStyles.h3,
    fontWeight: '600', // font-semibold
    marginBottom: 12,
  },
  loanCard: {
    borderRadius: 8, // rounded-lg (8px) - matching web p-3 rounded-lg border
    padding: 12, // p-3 (12px)
    marginBottom: 8, // space-y-2 sm:space-y-3 (8px base, 12px larger)
    borderWidth: 1, // border (1px)
  },
  loanHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  loanIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  loanInfo: {
    flex: 1,
  },
  loanDescription: {
    ...baseTextStyles.h3,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  loanMeta: {
    ...baseTextStyles.caption,
    color: '#666',
    textTransform: 'capitalize',
  },
  loanAmount: {
    alignItems: 'flex-end',
  },
  loanAmountText: {
    ...baseTextStyles.h3,
    fontWeight: '600',
    color: '#333',
  },
  loanAmountSubtext: {
    ...baseTextStyles.small,
    color: '#666',
  },
  loanProgress: {
    marginTop: 8,
  },
  loanProgressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  loanProgressText: {
    ...baseTextStyles.small,
    color: '#666',
  },
  loanProgressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  loanProgressFill: {
    height: '100%',
    backgroundColor: '#03A9F4',
    borderRadius: 3,
  },
  budgetCard: {
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
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  budgetLabel: {
    fontFamily: fonts.sans,
    marginBottom: 4,
  },
  budgetTotalContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4, // mt-1 (4px)
  },
  budgetCurrency: {
  },
  budgetTotal: {
    fontWeight: 'bold',
    color: '#333',
  },
  budgetSpent: {
    alignItems: 'flex-end',
  },
  budgetSpentLabel: {
    fontFamily: fonts.sans,
    marginBottom: 4,
  },
  budgetSpentValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4, // mt-1 (4px)
  },
  budgetSpentValue: {
    fontWeight: '600',
    color: '#333',
  },
  budgetProgressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  budgetProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8, // mt-2 (8px)
  },
  budgetPercentage: {
    ...baseTextStyles.caption,
    color: '#666',
  },
  budgetRemaining: {
    ...baseTextStyles.caption,
    color: '#666',
  },
  // New unified budget card styles
  budgetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  budgetStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  budgetStatusText: {
    fontFamily: fonts.sans,
    fontWeight: '600',
    fontSize: 12,
  },
  budgetSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 16,
    marginBottom: 16,
  },
  budgetSummaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  budgetSummaryLabel: {
    fontFamily: fonts.sans,
    marginBottom: 4,
    textAlign: 'center',
  },
  budgetAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  budgetDivider: {
    width: 1,
    height: 40,
    marginHorizontal: 8,
  },
  budgetProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  budgetProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  budgetMiniProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
    width: '100%',
  },
  budgetMiniProgressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  budgetMiniProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  budgetMiniPercentage: {
    fontSize: 10,
    fontFamily: fonts.sans,
  },
  chartCard: {
    borderRadius: 12,
    padding: 16, // p-4 sm:p-6 (16px base, 24px larger)
    paddingTop: 16, // Ensure top padding
    paddingBottom: 16, // Ensure bottom padding
    marginBottom: 24, // space-y-6 (24px)
    marginTop: 0, // Ensure no top margin
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'visible', // Allow title to be visible
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    fontWeight: '500',
  },
  chartTitleContainer: {
    marginBottom: 12, // mb-3 sm:mb-4 (12px base, 16px larger) - using base value
    marginTop: 0,
    paddingTop: 0,
    paddingBottom: 0,
    width: '100%',
    zIndex: 10, // Ensure title is above everything
  },
  chartTitle: {
    ...baseTextStyles.h3,
    fontWeight: '600', // font-semibold
    lineHeight: 20, // Explicit line height
    width: '100%',
  },
  chartContainer: {
    height: 200, // Matching web ResponsiveContainer height={200}
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start', // Align to top
    marginTop: 0, // Ensure no top margin
    paddingTop: 0, // Ensure no top padding
    overflow: 'hidden', // Prevent overflow
    position: 'relative',
    zIndex: 1, // Below title
  },
  yAxisContainer: {
    width: 50, // Space for Y-axis labels
    height: 150, // Bar area height (matches chartBars height)
    position: 'relative',
    paddingRight: 8,
    marginTop: 0, // Ensure aligned with chart bars
    alignSelf: 'flex-start', // Align to top
    paddingTop: 0, // Ensure no top padding
    marginBottom: 0, // Ensure no bottom margin
  },
  yAxisTick: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    height: 1,
  },
  yAxisLine: {
    width: 8,
    height: 1,
    marginRight: 4,
  },
  yAxisLabel: {
    ...baseTextStyles.small,
  },
  chartAreaContainer: {
    flex: 1,
    height: 150, // Bar area height
    position: 'relative',
  },
  gridLinesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150, // Match bar area height
    zIndex: 0, // Behind bars
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.25)', // Slightly softer dashed grid for dark mode
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 40, // Space between bars
    flex: 1,
    height: 150, // Bar area (200 - 50 for labels)
    paddingHorizontal: 20,
    position: 'relative',
    zIndex: 1, // Above grid lines
    marginTop: 0, // Ensure no top margin
  },
  chartBarContainer: {
    alignItems: 'center',
    flex: 1,
    maxWidth: 100,
    height: 200, // Full container height (includes labels)
    justifyContent: 'flex-end', // Align bars to bottom
  },
  chartBar: {
    width: 60, // Bar width
    borderRadius: 8, // Matching web radius={[8, 8, 0, 0]}
    minHeight: 4,
    borderTopLeftRadius: 8, // Rounded top corners
    borderTopRightRadius: 8,
    marginBottom: 8, // Space between bar and label
  },
  chartBarLabel: {
    ...baseTextStyles.caption,
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'center',
  },
  chartBarValue: {
    ...baseTextStyles.small,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    ...baseTextStyles.h2,
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markAllText: {
    ...baseTextStyles.h3,
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    ...baseTextStyles.h2,
  },
  notificationsList: {
    maxHeight: 500,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    ...baseTextStyles.h3,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationMessage: {
    ...baseTextStyles.bodySmall,
    lineHeight: 18,
    marginBottom: 4,
  },
  notificationTime: {
    ...baseTextStyles.caption,
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
    marginTop: 4,
  },
  emptyNotifications: {
    padding: 40,
    alignItems: 'center',
  },
  emptyNotificationsText: {
    ...baseTextStyles.bodySmall,
  },
  budgetInsightsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  budgetInsightsHeader: {
    marginBottom: 16,
  },
  budgetInsightsTitle: {
    ...baseTextStyles.h3,
    fontWeight: '600',
  },
  budgetInsightsContent: {
    gap: 12,
  },
  budgetInsightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  budgetInsightIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(3, 169, 244, 0.1)',
  },
  budgetInsightText: {
    flex: 1,
  },
  budgetInsightLabel: {
    ...baseTextStyles.bodySmall,
    fontWeight: '600',
    marginBottom: 4,
  },
  budgetInsightValue: {
    ...baseTextStyles.caption,
  },
});

