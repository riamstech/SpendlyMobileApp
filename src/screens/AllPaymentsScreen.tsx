import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  RefreshControl,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { fonts, textStyles } from '../constants/fonts';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Calendar,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Landmark,
  Building2,
  CreditCard,
} from 'lucide-react-native';
import { recurringService } from '../api/services/recurring';
import { authService } from '../api/services/auth';
import { formatDateForDisplay } from '../api/utils/dateUtils';
import { useTheme } from '../contexts/ThemeContext';
import { CategoryIcon } from '../components/CategoryIcon';
import LoadingSpinner from '../components/ui/LoadingSpinner';

interface AllPaymentsScreenProps {
  onBack: () => void;
}

interface UpcomingPayment {
  id: string;
  name: string;
  amount: number;
  currency: string;
  dueDate: string;
  category: string;
  icon?: string;
  type: 'income' | 'expense';
}

// Map category names to icons
const getPaymentIcon = (category: string) => {
  const iconMap: Record<string, any> = {
    Stocks: TrendingUp,
    Bonds: TrendingDown,
    'Real Estate': Landmark,
    Cryptocurrency: PieChart,
    'Mutual Funds': PieChart,
    ETFs: BarChart3,
    Commodities: Building2,
    Savings: Landmark,
  };
  return iconMap[category] || Calendar;
};

export default function AllPaymentsScreen({ onBack }: AllPaymentsScreenProps) {
  const { t, i18n } = useTranslation('common');
  const { width } = useWindowDimensions();
  const { isDark, colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payments, setPayments] = useState<UpcomingPayment[]>([]);
  const [currency, setCurrency] = useState('USD');

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      
      // Get user's default currency
      const userData = await authService.getCurrentUser();
      const defaultCurrency = (userData as any).defaultCurrency || 'USD';
      setCurrency(defaultCurrency);
      
      // Fetch upcoming payments
      const upcomingPayments = await recurringService.getUpcomingPayments(90); // Next 90 days
      
      // Transform to match our interface
      const transformedPayments: UpcomingPayment[] = upcomingPayments.map((payment: any) => ({
        id: payment.id.toString(),
        name: payment.name || payment.description || 'Recurring Payment',
        amount: payment.amount || 0,
        currency: payment.currency || defaultCurrency,
        dueDate: formatDateForDisplay(payment.nextDueDate || payment.dueDate, i18n.language),
        category: payment.category || 'Other',
        icon: payment.icon,
        type: payment.type || 'expense',
      }));
      
      setPayments(transformedPayments);
    } catch (error) {
      console.error('Failed to load payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPayments();
    setRefreshing(false);
  };

  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

  const formatAmount = (amount: number): string => {
    // Format with 2 decimal places and locale-specific formatting
    return amount.toLocaleString(i18n.language, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
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
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <ArrowLeft size={20} color={colors.foreground} />
          </Pressable>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              Upcoming Payments
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
              {payments.length} upcoming {payments.length === 1 ? 'payment' : 'payments'}
            </Text>
          </View>
        </View>

        {/* Summary Card - Dark Layout */}
        <View style={styles.statsGrid}>
            <View style={[styles.statsCard, styles.dueStatsCard]}>
               <View style={{ marginBottom: 8 }}>
                 <Calendar size={24} color="#FF5252" />
               </View>
               <Text style={[styles.statsLabel, textStyles.body]}>Total Amount Due</Text>
               <Text style={[styles.statsValue, textStyles.h3, { color: '#FF5252' }]}>
                 {currency} {formatAmount(totalAmount)}
               </Text>
            </View>
        </View>

        {/* Payments List */}
        <View style={styles.paymentsList}>
          {payments.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No upcoming payments
              </Text>
            </View>
          ) : (
            payments.map((payment) => {
              const IconComponent = getPaymentIcon(payment.category);
              
              return (
                <View
                  key={payment.id}
                  style={[
                    styles.paymentCard,
                    {
                      backgroundColor: colors.card,
                      borderLeftColor: '#FFC107', // Always yellow border like web
                    },
                  ]}
                >
                  <View style={styles.paymentContent}>
                    <View style={[styles.paymentIconContainer, { backgroundColor: colors.accent }]}>
                      <IconComponent size={20} color={colors.foreground} />
                    </View>
                    <View style={styles.paymentInfo}>
                      <Text style={[styles.paymentName, { color: colors.foreground }]}>
                        {payment.name}
                      </Text>
                      <View style={styles.paymentMeta}>
                        <Text style={[styles.paymentCategory, { color: colors.mutedForeground }]}>
                          {payment.category}
                        </Text>
                        <Text style={[styles.paymentSeparator, { color: colors.mutedForeground }]}>•</Text>
                        <Text style={[styles.paymentDate, { color: '#FFC107' }]}>
                          {payment.dueDate}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.paymentAmount}>
                      <View style={styles.paymentAmountContainer}>
                        <Text style={[styles.paymentCurrency, { color: colors.foreground }]}>
                          {payment.currency}
                        </Text>
                        <Text style={[styles.paymentAmountText, { color: colors.foreground }]}>
                          {payment.amount.toLocaleString(i18n.language)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
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
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    ...textStyles.body,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16, // gap-4 (16px)
    marginBottom: 24, // space-y-6 (24px)
  },
  backButton: {
    width: 40, // h-10 w-10 (40px)
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    ...textStyles.h3,
    marginBottom: 4, // mt-1 (4px)
  },
  headerSubtitle: {
    ...textStyles.bodySmall,
    color: '#717182', // text-muted-foreground
  },
  summaryCard: {
    padding: 16, // p-4 (16px)
    borderRadius: 12,
    marginBottom: 24, // space-y-6 (24px)
  },
  summaryLabel: {
    ...textStyles.bodySmall,
    marginBottom: 4, // mb-1 (4px)
  },
  summaryAmountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    // fontFamily: fonts.mono,
  },
  summaryCurrency: {
    ...textStyles.caption,
    marginRight: 4, // mr-1 (4px)
    // fontFamily: fonts.mono,
  },
  summaryAmount: {
    ...textStyles.body,
    fontWeight: 'normal',
    // fontFamily: fonts.mono,
  },
  paymentsList: {
    gap: 12, // space-y-3 (12px)
  },
  paymentCard: {
    borderRadius: 12,
    padding: 16, // p-4 (16px)
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  paymentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, // gap-3 (12px)
  },
  paymentIconContainer: {
    width: 40, // w-10 h-10 (40px)
    height: 40,
    borderRadius: 20, // rounded-full
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    ...textStyles.h3,
    color: '#212121', // text-foreground
    marginBottom: 4, // mt-1 (4px)
  },
  paymentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // gap-2 (8px)
    marginTop: 4, // mt-1 (4px)
  },
  paymentCategory: {
    ...textStyles.caption,
  },
  paymentSeparator: {
    ...textStyles.caption,
  },
  paymentDate: {
    ...textStyles.caption,
    color: '#FFC107',
  },
  paymentAmount: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  paymentAmountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    // fontFamily: fonts.mono,
  },
  paymentCurrency: {
    ...textStyles.caption,
    marginRight: 4, // mr-1 (4px)
    // fontFamily: fonts.mono,
  },
  paymentAmountText: {
    ...textStyles.body,
    fontWeight: '600',
    // fontFamily: fonts.mono,
  },
  emptyCard: {
    padding: 32, // p-8 (32px)
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...textStyles.body,
    textAlign: 'center',
  },
  statsGrid: {
    marginBottom: 24,
  },
  statsCard: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  dueStatsCard: {
    backgroundColor: '#362020', // Dark Red
  },
  statsLabel: {
    textAlign: 'center',
    marginBottom: 4,
    color: '#fff',
    opacity: 0.9,
  },
  statsValue: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

