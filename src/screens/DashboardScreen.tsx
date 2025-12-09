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
} from 'lucide-react-native';
import { authService } from '../api/services/auth';
import { dashboardService } from '../api/services/dashboard';
import { transactionsService } from '../api/services/transactions';
import { recurringService } from '../api/services/recurring';
import { financialService, FinancialSummary } from '../api/services/financialService';
import { budgetsService } from '../api/services/budgets';
import { currenciesService, Currency } from '../api/services/currencies';
import { notificationsService } from '../api/services/notifications';
import { formatDateForDisplay } from '../api/utils/dateUtils';
import { translateCategoryName } from '../utils/categoryTranslator';
import { useTheme } from '../contexts/ThemeContext';
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

interface UpcomingPayment {
  id: string;
  name: string;
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  dueDate: string;
  category: string;
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
}

export default function DashboardScreen({ 
  onViewAllTransactions, 
  onViewAllPayments,
  onViewInbox,
  onRenewLicense,
}: DashboardScreenProps = {}) {
  const { t, i18n } = useTranslation('common');
  const { width } = useWindowDimensions();
  const { isDark, colors } = useTheme();
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
  const [hoveredTransactionId, setHoveredTransactionId] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch user data to get default currency
      const userData = await authService.getCurrentUser();
      setUser(userData);
      const defaultCurrency = userData.defaultCurrency || 'USD';
      setCurrency(defaultCurrency);
      
      // Fetch currencies for base currency conversions (exactly like SpendlyApp)
      const currencies: Currency[] = await currenciesService.getCurrencies();
      // Create a map for quick lookup - handle both camelCase and snake_case
      const currencyMap = new Map(currencies.map(c => {
        // Handle both exchangeRate (camelCase) and exchange_rate (snake_case) from API
        // Use nullish coalescing to properly handle 0 values
        const rate = (c as any).exchangeRate ?? (c as any).exchange_rate ?? 1.0;
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
      
      // Fetch dashboard summary (includes canonical currency)
      const summary = await dashboardService.getSummary();
      setTotalIncome(summary.totalIncome || 0);
      setTotalExpenses(summary.totalExpenses || 0);
      setSavings(summary.totalSavings || 0);
      setTotalBalance(summary.totalIncome - summary.totalExpenses);
      setBudgetFromDate(summary.fromDate || null);
      setBudgetToDate(summary.toDate || null);
      
      // Fetch financial summary
      setLoadingFinancial(true);
      try {
        const financial = await financialService.getSummary();
        setFinancialSummary(financial);
      } catch (error) {
        console.error('Failed to load financial summary:', error);
      } finally {
        setLoadingFinancial(false);
      }
      
      // Fetch budget summary
      try {
        const budgetSummary = await budgetsService.getBudgetSummary();
        setMonthlyBudgetTotal(budgetSummary.total_budget || 0);
        setMonthlyBudgetSpent(budgetSummary.total_spent || 0);
        setMonthlyBudgetRemaining(budgetSummary.remaining || 0);
      } catch (error) {
        console.error('Failed to load budget summary:', error);
      }

      // Fetch recent transactions (last 10)
      const transactionsResponse = await transactionsService.getTransactions({
        per_page: 10,
      });

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
        console.log('Currency map sample:', sampleEntries);
        console.log('Target currency for conversion:', targetCurrency);
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
          category: tx.category || 'Uncategorized',
          description: tx.notes || tx.description || 'Transaction',
          date: dateStr,
          convertedAmount,
          defaultCurrency: targetCurrency,
          showConversion: !isDefaultCurrency,
        };
      });
      setRecentTransactions(transactions);
      
      // Fetch upcoming payments
      const upcoming = await recurringService.getUpcomingPayments(30);
      const payments = upcoming.map((p: any) => {
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
          category: p.category || 'Uncategorized',
          convertedAmount,
          defaultCurrency: targetCurrency,
          showConversion: !isDefaultCurrency,
        };
      });
      setUpcomingPayments(payments);
      
      // Fetch notifications
      try {
        const notificationsResponse = await notificationsService.getNotifications({ per_page: 10 });
        const notifs = notificationsResponse.data.map((n: any) => ({
          id: String(n.id),
          type: (n.type === 'recurring_payment' ? 'payment' : 
                 n.type === 'transaction_limit' ? 'alert' :
                 n.type === 'pro_expiration' ? 'alert' :
                 n.type === 'referral_reward' ? 'achievement' :
                 n.type === 'investment_reminder' ? 'transaction' : 'alert') as Notification['type'],
          title: n.title || '',
          message: n.message || '',
          time: n.created_at || '',
          read: n.is_read || false,
        }));
        setNotifications(notifs);
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
      
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
      // Don't show alert on initial load, just log
    } finally {
      setLoading(false);
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
    if (!timeString) return t('inbox.justNow') || 'Just now';
    try {
      const date = new Date(timeString);
      if (isNaN(date.getTime())) return timeString;
      
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (diffInSeconds < 60) return t('inbox.justNow') || 'Just now';
      if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} ${t('inbox.minutesAgo') || 'minutes ago'}`;
      }
      if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} ${t('inbox.hoursAgo') || 'hours ago'}`;
      }
      if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} ${t('inbox.daysAgo') || 'days ago'}`;
      }
      return formatDateForDisplay(timeString, i18n.language);
    } catch {
      return timeString;
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsService.markAsRead(Number(id));
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const spendingRatio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;
  const spendingRatioColor =
    spendingRatio > 90 ? '#FF5252' : spendingRatio > 70 ? '#FFC107' : '#4CAF50';
  
  const hasBudget = monthlyBudgetTotal > 0;
  const budgetUsedPercentage = hasBudget
    ? Math.min((monthlyBudgetSpent / monthlyBudgetTotal) * 100, 100)
    : 0;
  const isOverBudget = hasBudget && monthlyBudgetSpent > monthlyBudgetTotal;

  // Calculate period label for budget section
  const periodLabel = budgetFromDate && budgetToDate
    ? `${t('dashboard.currentCycle') || 'Current Cycle'} (${formatDateForDisplay(budgetFromDate, i18n.language)} - ${t('dashboard.today') || 'Today'})`
    : t('dashboard.monthlyBudget') || 'Monthly Budget';
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Chart data for Income vs Expense
  const maxChartValue = Math.max(totalIncome, totalExpenses) || 1;
  // Use chart bar container height (150px) for bars - labels are in paddingBottom area
  const chartBarMaxHeight = 150;
  const incomeBarHeight = maxChartValue > 0 ? (totalIncome / maxChartValue) * chartBarMaxHeight : 4;
  const expenseBarHeight = maxChartValue > 0 ? (totalExpenses / maxChartValue) * chartBarMaxHeight : 4;
  
  // Y-axis tick values (5 ticks: 0, 25%, 50%, 75%, 100%)
  // Position from top of bar area (150px), with 0 at bottom and 100% at top
  // Adjust position to account for tick height (subtract half tick height for centering)
  const yAxisTicks = [0, 0.25, 0.5, 0.75, 1].map(ratio => ({
    value: maxChartValue * ratio,
    position: (1 - ratio) * 150, // Position from top (0% at bottom, 100% at top)
  }));

  // Animated values for Income vs Expenses bars
  const incomeBarAnim = useRef(new Animated.Value(0)).current;
  const expenseBarAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const targetIncome = Math.max(incomeBarHeight, 4);
    const targetExpense = Math.max(expenseBarHeight, 4);

    incomeBarAnim.setValue(0);
    expenseBarAnim.setValue(0);

    Animated.parallel([
      Animated.timing(incomeBarAnim, {
        toValue: targetIncome,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(expenseBarAnim, {
        toValue: targetExpense,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [incomeBarHeight, expenseBarHeight]);
  // Responsive typography styles using the centralized typography system


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
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 80 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* License Status Banner */}
        {licenseStatus !== 'active' && (
          <View style={[
            styles.licenseBanner,
            {
              backgroundColor: licenseStatus === 'expired' 
                ? colors.destructive + '1A' 
                : colors.warning + '1A',
              borderColor: licenseStatus === 'expired'
                ? colors.destructive + '33'
                : colors.warning + '33',
            }
          ]}>
            <Text style={[
              styles.licenseBannerText,
              responsiveTextStyles.caption,
              { 
                color: licenseStatus === 'expired' 
                  ? colors.destructive 
                  : colors.warning 
              }
            ]}>
              {licenseStatus === 'expired'
                ? t('dashboard.licenseExpired') || 'Your premium license has expired. You are in View Only mode.'
                : t('dashboard.licenseExpiring', { days: daysRemaining }) || `Your premium license expires in ${daysRemaining} days.`}
            </Text>
            <Pressable
              onPress={onRenewLicense}
              style={({ pressed }) => [
                styles.renewButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={[
                styles.renewButtonText,
                responsiveTextStyles.small,
                { 
                  color: licenseStatus === 'expired' 
                    ? colors.destructive 
                    : colors.warning 
                }
              ]}>
                {t('dashboard.renewNow') || 'Renew Now'}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background }]}>
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
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => setValuesHidden(!valuesHidden)}
              style={({ pressed }) => [
                styles.eyeButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              {valuesHidden ? (
                <EyeOff size={20} color={colors.foreground} />
              ) : (
                <Eye size={20} color={colors.foreground} />
              )}
            </Pressable>
            <Pressable
              onPress={() => onViewInbox ? onViewInbox() : setShowNotifications(true)}
              style={({ pressed }) => [
                styles.bellButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Bell size={20} color={colors.foreground} />
              {unreadCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {/* Balance Overview Card */}
        <LinearGradient
          colors={['#03A9F4', '#0288D1']}
          style={styles.balanceCard}
        >
          <View style={styles.balanceHeader}>
            <Wallet size={16} color="rgba(255,255,255,0.9)" />
            <Text style={[styles.balanceLabel, responsiveTextStyles.caption]}>
              {t('dashboard.totalBalance') || 'Total Balance'}
            </Text>
          </View>
          <View style={styles.balanceAmountContainer}>
            {!valuesHidden && (
              <Text style={[styles.balanceCurrency, responsiveTextStyles.caption]}>
                {currency}{' '}
              </Text>
            )}
            <Text style={[styles.balanceAmount, responsiveTextStyles.displaySmall]}>
              {formatValue(totalBalance)}
            </Text>
          </View>
          <View style={styles.balanceStats}>
            <View style={styles.balanceStatItem}>
              <View style={styles.balanceStatHeader}>
                <ArrowUpRight size={14} color="rgba(255,255,255,0.9)" />
                <Text style={[styles.balanceStatLabel, responsiveTextStyles.caption]}>
                  {t('dashboard.income') || 'Income'}
                </Text>
              </View>
              <View style={styles.balanceStatValueContainer}>
                {!valuesHidden && (
                  <Text style={[styles.balanceStatCurrency, responsiveTextStyles.caption]}>
                    {currency}{' '}
                  </Text>
                )}
                <Text style={[styles.balanceStatValue, responsiveTextStyles.bodySmall]}>
                  {formatValue(totalIncome)}
                </Text>
              </View>
            </View>
            <View style={styles.balanceStatItem}>
              <View style={styles.balanceStatHeader}>
                <ArrowDownRight size={14} color="rgba(255,255,255,0.9)" />
                <Text style={[styles.balanceStatLabel, responsiveTextStyles.caption]}>
                  {t('dashboard.expenses') || 'Expenses'}
                </Text>
              </View>
              <View style={styles.balanceStatValueContainer}>
                {!valuesHidden && (
                  <Text style={[styles.balanceStatCurrency, responsiveTextStyles.caption]}>
                    {currency}{' '}
                  </Text>
                )}
                <Text style={[styles.balanceStatValue, responsiveTextStyles.bodySmall]}>
                  {formatValue(totalExpenses)}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Financial Health */}
        {financialSummary && (
          <View style={[styles.financialHealthCard, { backgroundColor: colors.card }]}>
            <View style={styles.financialHealthHeader}>
              <Text style={[responsiveTextStyles.h4, { color: colors.foreground }]}>
                {t('dashboard.financialHealth') || 'Financial Health'}
              </Text>
              <View style={[
                styles.netWorthBadge,
                { backgroundColor: financialSummary.net_worth >= 0 ? 'rgba(76,175,80,0.1)' : 'rgba(255,82,82,0.1)' }
              ]}>
                <Text style={[
                  styles.netWorthText,
                  { color: financialSummary.net_worth >= 0 ? '#4CAF50' : '#FF5252' }
                ]}>
                  {`${t('dashboard.netWorth') || 'Net Worth:'} ${formatMoney(financialSummary.net_worth)}`}
                </Text>
              </View>
            </View>
            <View style={styles.assetsLiabilitiesRow}>
              {/* Total Assets Card */}
              <View style={[
                styles.assetCard,
                {
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(209, 250, 229, 1)', // emerald-50 / emerald-900/10
                  borderColor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(209, 250, 229, 1)', // emerald-100 / emerald-900/20
                }
              ]}>
                <View style={styles.assetHeader}>
                  <View style={[
                    styles.assetIconContainer,
                    {
                      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(209, 250, 229, 1)', // emerald-100 / emerald-900/30
                    }
                  ]}>
                    <TrendingUp size={16} color={isDark ? '#34D399' : '#059669'} /> {/* emerald-400 / emerald-600 */}
                  </View>
                  <Text style={[
                    styles.assetLabel,
                    responsiveTextStyles.caption,
                    {
                      color: isDark ? '#A7F3D0' : '#064E3B', // emerald-200 / emerald-900
                    }
                  ]}>
                    {t('dashboard.totalAssets') || 'Total Assets'}
                  </Text>
                </View>
                <Text style={[
                  styles.assetValue,
                  responsiveTextStyles.h4,
                  {
                    color: isDark ? '#6EE7B7' : '#047857', // emerald-300 / emerald-700
                  }
                ]}>
                  {formatMoney(financialSummary.total_assets)}
                </Text>
              </View>

              {/* Total Liabilities Card */}
              <View style={[
                styles.assetCard,
                {
                  backgroundColor: isDark ? 'rgba(225, 29, 72, 0.1)' : 'rgba(255, 228, 230, 1)', // rose-50 / rose-900/10
                  borderColor: isDark ? 'rgba(225, 29, 72, 0.2)' : 'rgba(255, 228, 230, 1)', // rose-100 / rose-900/20
                }
              ]}>
                <View style={styles.assetHeader}>
                  <View style={[
                    styles.assetIconContainer,
                    {
                      backgroundColor: isDark ? 'rgba(225, 29, 72, 0.3)' : 'rgba(255, 228, 230, 1)', // rose-100 / rose-900/30
                    }
                  ]}>
                    <TrendingDown size={16} color={isDark ? '#FB7185' : '#E11D48'} /> {/* rose-400 / rose-600 */}
                  </View>
                  <Text style={[
                    styles.assetLabel,
                    responsiveTextStyles.caption,
                    {
                      color: isDark ? '#FECDD3' : '#9F1239', // rose-200 / rose-900
                    }
                  ]}>
                    {t('dashboard.totalLiabilities') || 'Total Liabilities'}
                  </Text>
                </View>
                <Text style={[
                  styles.assetValue,
                  responsiveTextStyles.h4,
                  {
                    color: isDark ? '#FDA4AF' : '#BE123C', // rose-300 / rose-700
                  }
                ]}>
                  {formatMoney(financialSummary.total_liabilities)}
                </Text>
              </View>
            </View>
            
            {/* Active Loans */}
            {financialSummary.liabilities && financialSummary.liabilities.length > 0 && (
              <View style={styles.loansSection}>
                <Text style={[styles.loansTitle, { color: colors.foreground }]}>
                  {t('dashboard.activeLoans') || 'Active Loans'}
                </Text>
                {financialSummary.liabilities.map((loan) => (
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
                          {loan.type} {t('dashboard.loan') || 'Loan'} • {t('dashboard.ends')} {formatDateForDisplay(loan.end_date, i18n.language)}
                        </Text>
                      </View>
                      <View style={styles.loanAmount}>
                        <Text style={[styles.loanAmountText, { color: colors.foreground }]}>
                          {formatMoney(loan.remaining_amount)}
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
                          {formatMoney(loan.paid_amount)} {t('dashboard.paid') || 'paid'}
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

        {/* Monthly Budget Overview */}
        {hasBudget && (
          <View style={[styles.budgetCard, { backgroundColor: colors.card }]}>
            <View style={styles.budgetHeader}>
              <View>
                <Text style={[styles.budgetLabel, responsiveTextStyles.caption, { color: colors.mutedForeground }]}>
                  {periodLabel}
                </Text>
                <View style={styles.budgetTotalContainer}>
                  {!valuesHidden && (
                    <Text style={[styles.budgetCurrency, responsiveTextStyles.caption, { color: colors.mutedForeground }]}>
                      {currency}{' '}
                    </Text>
                  )}
                  <Text style={[styles.budgetTotal, responsiveTextStyles.bodySmall, { color: colors.foreground }]}>
                    {formatValue(monthlyBudgetTotal)}
                  </Text>
                </View>
              </View>
              <View style={styles.budgetSpent}>
                <Text style={[styles.budgetSpentLabel, responsiveTextStyles.caption, { color: colors.mutedForeground }]}>
                  {t('dashboard.spentThisPeriod') || 'Spent This Period'}
                </Text>
                <View style={styles.budgetSpentValueContainer}>
                  {!valuesHidden && (
                    <Text style={[styles.budgetCurrency, responsiveTextStyles.caption, { color: colors.mutedForeground }]}>
                      {currency}{' '}
                    </Text>
                  )}
                  <Text style={[
                    styles.budgetSpentValue,
                    responsiveTextStyles.bodySmall,
                    { color: isOverBudget ? colors.destructive : colors.foreground }
                  ]}>
                    {formatValue(monthlyBudgetSpent)}
                  </Text>
                </View>
              </View>
            </View>
            <View style={[styles.budgetProgressBar, { backgroundColor: '#e0e0e0' }]}>
              <View
                style={[
                  styles.budgetProgressFill,
                  {
                    width: `${budgetUsedPercentage}%`,
                    backgroundColor: isOverBudget ? '#FF5252' : '#03A9F4',
                  },
                ]}
              />
            </View>
            <View style={styles.budgetFooter}>
              <Text style={[styles.budgetPercentage, responsiveTextStyles.caption, { color: colors.mutedForeground }]}>
                {budgetUsedPercentage.toFixed(1)}% {t('dashboard.used') || 'used'}
              </Text>
              <Text style={[styles.budgetRemaining, responsiveTextStyles.caption, { color: colors.mutedForeground }]}>
                {valuesHidden ? '••••' : (
                  isOverBudget
                    ? `${t('dashboard.overBy') || 'Over by'} ${currency} ${formatValue(monthlyBudgetSpent - monthlyBudgetTotal)}`
                    : `${currency} ${formatValue(monthlyBudgetRemaining)} ${t('dashboard.remaining') || 'remaining'}`
                )}
              </Text>
            </View>
          </View>
        )}

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
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
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
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
                <View
                  style={[
                    styles.progressFill,
                    { 
                      width: `${Math.min(spendingRatio, 100)}%`, 
                      backgroundColor: spendingRatioColor,
                      height: 6,
                    },
                  ]}
                />
              </View>
            )}
          </View>
        </View>

        {/* Income vs Expense Chart */}
        <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
          <View style={styles.chartTitleContainer}>
            <Text style={[styles.chartTitle, responsiveTextStyles.h4, { color: colors.foreground }]}>
              {t('dashboard.incomeVsExpenses') || 'Income vs Expenses'}
            </Text>
          </View>
          <View style={styles.chartContainer}>
            {/* Y-Axis */}
            <View style={styles.yAxisContainer}>
              {yAxisTicks.map((tick, index) => (
                <View key={index} style={[styles.yAxisTick, { top: tick.position }]}>
                  <View style={[styles.yAxisLine, { backgroundColor: colors.border }]} />
                  <Text style={[styles.yAxisLabel, { color: colors.mutedForeground }]}>
                    {valuesHidden ? '••••' : formatValue(tick.value)}
                  </Text>
                </View>
              ))}
            </View>
            {/* Chart Area with Grid Lines and Bars */}
            <View style={styles.chartAreaContainer}>
              {/* Horizontal Grid Lines */}
              <View style={styles.gridLinesContainer}>
                {yAxisTicks.map((tick, index) => (
                  <View 
                    key={`grid-${index}`} 
                    style={[
                      styles.gridLine, 
                      { 
                        top: tick.position,
                        backgroundColor: colors.border,
                      }
                    ]} 
                  />
                ))}
              </View>
              {/* Chart Bars */}
              <View style={styles.chartBars}>
              <View style={styles.chartBarContainer}>
                <Animated.View
                  style={[
                    styles.chartBar,
                    {
                      height: incomeBarAnim,
                      backgroundColor: '#4CAF50',
                    },
                  ]}
                />
                <Text style={[styles.chartBarLabel, { color: colors.foreground }]}>
                  {t('dashboard.income') || 'Income'}
                </Text>
                <Text style={[styles.chartBarValue, { color: colors.foreground }]}>
                  {valuesHidden ? '••••' : `${currency} ${formatValue(totalIncome)}`}
                </Text>
              </View>
              <View style={styles.chartBarContainer}>
                <Animated.View
                  style={[
                    styles.chartBar,
                    {
                      height: expenseBarAnim,
                      backgroundColor: '#FF5252',
                    },
                  ]}
                />
                <Text style={[styles.chartBarLabel, { color: colors.foreground }]}>
                  {t('dashboard.expenses') || 'Expenses'}
                </Text>
                <Text style={[styles.chartBarValue, { color: colors.foreground }]}>
                  {valuesHidden ? '••••' : `${currency} ${formatValue(totalExpenses)}`}
                </Text>
              </View>
            </View>
            </View>
          </View>
        </View>

        {/* Upcoming Payments */}
        {upcomingPayments.length > 0 && (
          <View style={styles.section}>
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
            <View style={{ gap: 12 }}> {/* space-y-3 (12px) */}
              {upcomingPayments.slice(0, 3).map((payment) => (
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
                          {translateCategoryName(payment.category, t)}
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
                      {valuesHidden ? '••••' : `${payment.currency} ${formatValue(payment.amount)}`}
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
        <View style={styles.section}>
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
              {recentTransactions.slice(0, 5).map((transaction, index) => (
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
                          {translateCategoryName(transaction.category, t)}
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
                            : `${transaction.type === 'income' ? '+' : '-'}${transaction.currency} ${formatValue(transaction.amount)}`}
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
                              onViewAllTransactions && onViewAllTransactions();
                            }}
                          >
                            <Edit2 size={16} color={colors.mutedForeground} />
                          </Pressable>
                          <Pressable
                            style={styles.transactionActionButton}
                            onPress={() => {
                              onViewAllTransactions && onViewAllTransactions();
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
              <Text style={styles.modalTitle}>{t('inbox.notifications') || 'Notifications'}</Text>
              <View style={styles.modalActions}>
                {unreadCount > 0 && (
                  <Pressable onPress={handleMarkAllAsRead} style={styles.markAllButton}>
                    <Text style={[styles.markAllText, { color: colors.primary }]}>
                      {t('inbox.markAllAsRead') || 'Mark all as read'}
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
                notifications.map((notification) => (
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
                    {t('inbox.noNotifications') || 'No notifications'}
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
    flexDirection: 'column', // grid-cols-1 (stacked vertically on mobile)
    gap: 12, // gap-3 sm:gap-4 (12px base, 16px larger)
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
    fontWeight: 'bold',
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
});

