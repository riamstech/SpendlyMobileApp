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
  const [loadingPricing, setLoadingPricing] = useState(false);
  const [pendingPaymentDialog, setPendingPaymentDialog] = useState(false);
  const [manualPricingData, setManualPricingData] = useState<{
    monthly: string;
    yearly: string;
    monthlyAmount: number;
    yearlyAmount: number;
    currencyCode: string;
  } | null>(null);

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
      console.log('Loading user and currencies...');
      const [userData, currenciesData] = await Promise.all([
        usersService.getCurrentUser(),
        currenciesService.getAll(),
      ]);
      console.log('Loaded - user:', userData?.email || 'no user', 'currencies:', currenciesData?.length || 0);
      setUser(userData);
      setCurrencies(currenciesData);
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
      console.log('PricingData: No user available');
      return null;
    }
    
    if (currencies.length === 0) {
      console.log('PricingData: No currencies available');
      return null;
    }
    
    // Default to USD if checking country fails or currencies not loaded
    // Prioritize user's selected defaultCurrency if available, otherwise fallback to country-based currency
    const userCurrencyCode = user.defaultCurrency || getCurrencyForCountry(user.country) || 'USD';
    console.log('PricingData: Calculating for currency:', userCurrencyCode);
    
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
    
    console.log('PricingData calculated:', result);
    return result;
  }, [user, currencies]);

  // Show payment dialog when pricing data becomes available after loading
  React.useEffect(() => {
    console.log('useEffect triggered - pendingPaymentDialog:', pendingPaymentDialog, 'pricingData:', !!pricingData, 'loadingPricing:', loadingPricing);
    if (pendingPaymentDialog && pricingData && !loadingPricing) {
      console.log('Pricing data ready, showing payment dialog:', pricingData);
      setStripePaymentData({
        planType: 'monthly',
        paymentMethod: 'card',
      });
      setShowStripePayment(true);
      setPendingPaymentDialog(false);
    } else if (pendingPaymentDialog && !loadingPricing && !pricingData) {
      console.log('Still waiting for pricing data... user:', !!user, 'currencies:', currencies.length);
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
            onRenewLicense={async () => {
              console.log('Renew clicked - pricingData:', pricingData, 'user:', !!user, 'currencies:', currencies.length);
              
              // If pricing data is already available, show dialog immediately
              if (pricingData) {
                console.log('Pricing data available, showing dialog immediately');
                setStripePaymentData({
                  planType: 'monthly',
                  paymentMethod: 'card',
                });
                setShowStripePayment(true);
                return;
              }

              // Always try to load/reload data to ensure we have the latest
              console.log('Loading user and currencies data...');
              try {
                setPendingPaymentDialog(true);
                const loadedData = await loadUserAndCurrencies();
                console.log('Data loaded - user:', !!loadedData.userData, 'currencies:', loadedData.currenciesData.length);
                
                // Calculate pricing directly from loaded data
                if (loadedData.userData && loadedData.currenciesData.length > 0) {
                  const userCurrencyCode = loadedData.userData.defaultCurrency || getCurrencyForCountry(loadedData.userData.country) || 'USD';
                  const monthlyPrice = convertUsdToCurrency(2, userCurrencyCode, loadedData.currenciesData);
                  const yearlyPrice = convertUsdToCurrency(10, userCurrencyCode, loadedData.currenciesData);
                  
                  const calculatedPricing = {
                    monthly: `${monthlyPrice.symbol}${formatCurrencyAmount(monthlyPrice.amount, monthlyPrice.symbol)}`,
                    yearly: `${yearlyPrice.symbol}${formatCurrencyAmount(yearlyPrice.amount, yearlyPrice.symbol)}`,
                    monthlyAmount: monthlyPrice.amount,
                    yearlyAmount: yearlyPrice.amount,
                    currencyCode: userCurrencyCode
                  };
                  
                  console.log('Calculated pricing directly:', calculatedPricing);
                  
                  // Store calculated pricing and show dialog
                  setManualPricingData(calculatedPricing);
                  setStripePaymentData({
                    planType: 'monthly',
                    paymentMethod: 'card',
                  });
                  setShowStripePayment(true);
                  setPendingPaymentDialog(false);
                } else {
                  console.log('User or currencies missing after load');
                  setPendingPaymentDialog(false);
                  setActiveTab('settings');
                }
              } catch (error) {
                console.error('Failed to load pricing data:', error);
                setPendingPaymentDialog(false);
                // Fallback to settings if loading fails
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

