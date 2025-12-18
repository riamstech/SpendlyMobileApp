import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import DashboardScreen from './DashboardScreen';
import AddTransactionScreen from './AddTransactionScreen';
import EditTransactionScreen from './EditTransactionScreen';
import AllTransactionsScreen from './AllTransactionsScreen';
import AllPaymentsScreen from './AllPaymentsScreen';
import ReportsScreen from './ReportsScreen';
import BudgetScreen from './BudgetScreen';
import InvestmentsScreen from './InvestmentsScreen';
import OffersScreen from './OffersScreen';
import SettingsScreen from './SettingsScreen';
import InboxScreen from './InboxScreen';
import ReferralScreen from './ReferralScreen';
import GoalsScreen from './GoalsScreen';
import AnalyticsScreen from './AnalyticsScreen';
import ReceiptsScreen from './ReceiptsScreen';
import SupportTicketsScreen from './SupportTicketsScreen';
import BottomTabNavigator from '../components/BottomTabNavigator';
import StripePaymentDialog from '../components/StripePaymentDialog';
import { usersService } from '../api/services/users';
import { currenciesService } from '../api/services/currencies';
import { Currency } from '../api/types/category';
import { getCurrencyForCountry, convertUsdToCurrency, formatCurrencyAmount } from '../utils/currencyConverter';
import i18n from '../i18n';
import { Transaction } from '../api/types/transaction';
import { transactionsService } from '../api/services/transactions';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Alert } from 'react-native';
import { authService } from '../api/services/auth';

interface MainScreenProps {
  onLogout?: () => void;
  initialScreen?: 'inbox' | 'home' | 'reports' | 'budget' | 'investments' | 'offers' | 'settings';
}

export default function MainScreen({ onLogout, initialScreen }: MainScreenProps) {
  const [activeTab, setActiveTab] = useState('home');
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [showAllPayments, setShowAllPayments] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showReceipts, setShowReceipts] = useState(false);
  const [showSupportTickets, setShowSupportTickets] = useState(false);
  const [showStripePayment, setShowStripePayment] = useState(false);
  const [stripePaymentData, setStripePaymentData] = useState<{
    planType: 'monthly' | 'yearly';
    paymentMethod: 'card' | 'upi';
  } | null>(null);
  const [user, setUser] = useState<any>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loadingPricing, setLoadingPricing] = useState(false);
  const [pendingPaymentDialog, setPendingPaymentDialog] = useState(false);
  const [manualPricingData, setManualPricingData] = useState<{
    monthly: string;
    yearly: string;
    monthlyAmount: number;
    yearlyAmount: number;
    currencyCode: string;
  } | null>(null);

  const [showEditTransaction, setShowEditTransaction] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [loadingTransaction, setLoadingTransaction] = useState(false);
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);

  // Handle initial screen from notification
  React.useEffect(() => {
    if (initialScreen === 'inbox') {
      setShowInbox(true);
    }
  }, [initialScreen]);

  // Load user and currencies data for payment dialog
  const loadUserAndCurrencies = async () => {
    try {
      setLoadingPricing(true);
      const [userData, currenciesData] = await Promise.all([
        authService.getCurrentUser(),
        currenciesService.getCurrencies(),
      ]);
      setUser(userData);
      setCurrencies(currenciesData);
      
      // Apply user's preferred language if available and different from current
      if (userData?.preferredLocale && userData.preferredLocale !== i18n.language) {
        await i18n.changeLanguage(userData.preferredLocale);
      }
      
      return { userData, currenciesData };
    } catch (error) {
      console.error('Failed to load user/currencies:', error);
      throw error;
    } finally {
      setLoadingPricing(false);
    }
  };

  useEffect(() => {
    loadUserAndCurrencies();
  }, []);

  // Calculate pricing based on user's country/currency
  const pricingData = React.useMemo(() => {
    if (!user) {
      return null;
    }
    
    if (currencies.length === 0) {
      return null;
    }
    
    // Default to USD if checking country fails or currencies not loaded
    // Prioritize user's selected defaultCurrency if available, otherwise fallback to country-based currency
    const userCurrencyCode = user.defaultCurrency || getCurrencyForCountry(user.country) || 'USD';
    
    // Use base prices from Web App logic: $2/mo and $10/yr
    const monthlyPrice = convertUsdToCurrency(2, userCurrencyCode, currencies);
    const yearlyPrice = convertUsdToCurrency(10, userCurrencyCode, currencies);
    
    const result = {
      monthly: `${monthlyPrice.symbol}${formatCurrencyAmount(monthlyPrice.amount, monthlyPrice.symbol)}`,
      yearly: `${yearlyPrice.symbol}${formatCurrencyAmount(yearlyPrice.amount, yearlyPrice.symbol)}`,
      monthlyAmount: monthlyPrice.amount,
      yearlyAmount: yearlyPrice.amount,
      currencyCode: userCurrencyCode
    };
    
    return result;
  }, [user, currencies]);

  // Show payment dialog when pricing data becomes available after loading
  React.useEffect(() => {
    if (pendingPaymentDialog && pricingData && !loadingPricing) {
      setStripePaymentData({
        planType: 'monthly',
        paymentMethod: 'card',
      });
      setShowStripePayment(true);
      setPendingPaymentDialog(false);
    } else if (pendingPaymentDialog && !loadingPricing && !pricingData) {
    }
  }, [pricingData, pendingPaymentDialog, loadingPricing, user, currencies]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleAddClick = () => {
    setShowAddTransaction(true);
  };

  const handleAddTransactionSuccess = () => {
    setShowAddTransaction(false);
    // Optionally refresh the dashboard
  };

  const handleAddTransactionCancel = () => {
    setShowAddTransaction(false);
  };

  const handleEditTransaction = async (id: string) => {
    try {
      setLoadingTransaction(true);
      const transaction = await transactionsService.getTransaction(Number(id));
      setTransactionToEdit(transaction);
      setShowEditTransaction(true);
    } catch (error) {
       console.error('Failed to load transaction for editing:', error);
       Alert.alert('Error', 'Failed to load transaction details');
    } finally {
      setLoadingTransaction(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
             try {
               await transactionsService.deleteTransaction(Number(id));
               setDashboardRefreshKey(prev => prev + 1);
             } catch (error) {
               console.error('Failed to delete transaction:', error);
               Alert.alert('Error', 'Failed to delete transaction');
             }
          }
        }
      ]
    );
  };


  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return <DashboardScreen />;
      case 'reports':
        return <ReportsScreen />;
      case 'budget':
        return <BudgetScreen />;
      case 'investments':
        return <InvestmentsScreen />;
      case 'offers':
        return <OffersScreen />;
      case 'settings':
        return (
          <SettingsScreen
            onLogout={onLogout || (() => {})}
            onViewReferral={() => setShowReferral(true)}
            onViewGoals={() => setShowGoals(true)}
            onViewAnalytics={() => setShowAnalytics(true)}
            onViewReceipts={() => setShowReceipts(true)}
            onViewSupportTickets={() => setShowSupportTickets(true)}
          />
        );
      default:
        return <DashboardScreen />;
    }
  };

  if (showAddTransaction) {
    return (
      <AddTransactionScreen
        onSuccess={handleAddTransactionSuccess}
        onCancel={handleAddTransactionCancel}
      />
    );
  }

  if (loadingTransaction) {
    return <LoadingSpinner size="large" text="Loading transaction..." fullScreen />;
  }

  if (showEditTransaction && transactionToEdit) {
    return (
      <EditTransactionScreen
        transaction={transactionToEdit}
        onSuccess={() => {
          setShowEditTransaction(false);
          setTransactionToEdit(null);
          setDashboardRefreshKey(prev => prev + 1);
        }}
        onCancel={() => {
          setShowEditTransaction(false);
          setTransactionToEdit(null);
        }}
      />
    );
  }

  if (showAllTransactions) {
    return (
      <AllTransactionsScreen
        onBack={() => setShowAllTransactions(false)}
      />
    );
  }

  if (showAllPayments) {
    return (
      <AllPaymentsScreen
        onBack={() => setShowAllPayments(false)}
      />
    );
  }

  if (showInbox) {
    return (
      <InboxScreen
        onBack={() => setShowInbox(false)}
      />
    );
  }

  if (showReferral) {
    return (
      <ReferralScreen
        onBack={() => setShowReferral(false)}
      />
    );
  }

  if (showGoals) {
    return (
      <GoalsScreen
        onBack={() => setShowGoals(false)}
      />
    );
  }

  if (showAnalytics) {
    return (
      <AnalyticsScreen
        onBack={() => setShowAnalytics(false)}
      />
    );
  }

  if (showReceipts) {
    return (
      <ReceiptsScreen
        onBack={() => setShowReceipts(false)}
      />
    );
  }

  if (showSupportTickets) {
    return (
      <SupportTicketsScreen
        onBack={() => setShowSupportTickets(false)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {activeTab === 'home' ? (
          <DashboardScreen
            key={dashboardRefreshKey}
            onViewAllTransactions={() => setShowAllTransactions(true)}
            onViewAllPayments={() => setShowAllPayments(true)}
            onViewInbox={() => setShowInbox(true)}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onRenewLicense={() => {
              setActiveTab('settings');
            }}
          />
        ) : (
          renderScreen()
        )}
      </View>
      <BottomTabNavigator
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onAddClick={handleAddClick}
      />
      
      {/* Payment Dialog */}
      {stripePaymentData && (
        <StripePaymentDialog
          isOpen={showStripePayment}
          onClose={() => {
            setShowStripePayment(false);
            setStripePaymentData(null);
            setManualPricingData(null);
          }}
          planType={stripePaymentData.planType}
          paymentMethod={stripePaymentData.paymentMethod}
          monthlyPrice={manualPricingData?.monthly || pricingData?.monthly}
          yearlyPrice={manualPricingData?.yearly || pricingData?.yearly}
          monthlyAmount={manualPricingData?.monthlyAmount || pricingData?.monthlyAmount}
          yearlyAmount={manualPricingData?.yearlyAmount || pricingData?.yearlyAmount}
          currencyCode={manualPricingData?.currencyCode || pricingData?.currencyCode}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
  },
});

