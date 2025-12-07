import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import DashboardScreen from './DashboardScreen';
import AddTransactionScreen from './AddTransactionScreen';
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
import BottomTabNavigator from '../components/BottomTabNavigator';
import StripePaymentDialog from '../components/StripePaymentDialog';
import { usersService } from '../api/services/users';
import { currenciesService, Currency } from '../api/services/currencies';
import { getCurrencyForCountry, convertUsdToCurrency, formatCurrencyAmount } from '../utils/currencyConverter';

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
  const [showStripePayment, setShowStripePayment] = useState(false);
  const [stripePaymentData, setStripePaymentData] = useState<{
    planType: 'monthly' | 'yearly';
    paymentMethod: 'card' | 'upi';
  } | null>(null);
  const [user, setUser] = useState<any>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);

  // Handle initial screen from notification
  React.useEffect(() => {
    if (initialScreen === 'inbox') {
      setShowInbox(true);
    }
  }, [initialScreen]);

  // Load user and currencies data for payment dialog
  useEffect(() => {
    const loadData = async () => {
      try {
        const [userData, currenciesData] = await Promise.all([
          usersService.getCurrentUser(),
          currenciesService.getAll(),
        ]);
        setUser(userData);
        setCurrencies(currenciesData);
      } catch (error) {
        console.error('Failed to load user/currencies:', error);
      }
    };
    loadData();
  }, []);

  // Calculate pricing based on user's country/currency
  const pricingData = React.useMemo(() => {
    if (!user) return null;
    
    // Default to USD if checking country fails or currencies not loaded
    // Prioritize user's selected defaultCurrency if available, otherwise fallback to country-based currency
    const userCurrencyCode = user.defaultCurrency || getCurrencyForCountry(user.country) || 'USD';
    
    // Use base prices from Web App logic: $2/mo and $10/yr
    const monthlyPrice = convertUsdToCurrency(2, userCurrencyCode, currencies);
    const yearlyPrice = convertUsdToCurrency(10, userCurrencyCode, currencies);
    
    return {
      monthly: `${monthlyPrice.symbol}${formatCurrencyAmount(monthlyPrice.amount, monthlyPrice.symbol)}`,
      yearly: `${yearlyPrice.symbol}${formatCurrencyAmount(yearlyPrice.amount, yearlyPrice.symbol)}`,
      monthlyAmount: monthlyPrice.amount,
      yearlyAmount: yearlyPrice.amount,
      currencyCode: userCurrencyCode
    };
  }, [user, currencies]);

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

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {activeTab === 'home' ? (
          <DashboardScreen
            onViewAllTransactions={() => setShowAllTransactions(true)}
            onViewAllPayments={() => setShowAllPayments(true)}
            onViewInbox={() => setShowInbox(true)}
            onRenewLicense={() => {
              // Show payment dialog instead of navigating to settings
              // Only show if pricing data is available
              if (pricingData) {
                setStripePaymentData({
                  planType: 'monthly',
                  paymentMethod: 'card',
                });
                setShowStripePayment(true);
              } else {
                // If pricing not loaded yet, navigate to settings as fallback
                setActiveTab('settings');
              }
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
          }}
          planType={stripePaymentData.planType}
          paymentMethod={stripePaymentData.paymentMethod}
          monthlyPrice={pricingData?.monthly}
          yearlyPrice={pricingData?.yearly}
          monthlyAmount={pricingData?.monthlyAmount}
          yearlyAmount={pricingData?.yearlyAmount}
          currencyCode={pricingData?.currencyCode}
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

