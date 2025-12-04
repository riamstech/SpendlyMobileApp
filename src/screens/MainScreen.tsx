import React, { useState } from 'react';
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

interface MainScreenProps {
  onLogout?: () => void;
}

export default function MainScreen({ onLogout }: MainScreenProps) {
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
              // Navigate to Settings subscription section
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

