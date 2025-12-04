import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Lock, Zap, TrendingUp, PieChart, Calendar } from 'lucide-react-native';
import { fonts } from '../constants/fonts';
import { useTheme } from '../contexts/ThemeContext';
import Button from './ui/Button';

interface FreemiumLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionCount: number;
  transactionLimit: number;
  onUpgrade?: () => void;
}

export default function FreemiumLimitModal({
  isOpen,
  onClose,
  transactionCount,
  transactionLimit,
  onUpgrade,
}: FreemiumLimitModalProps) {
  const { t } = useTranslation('common');
  const { width } = useWindowDimensions();
  const { isDark, colors } = useTheme();

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    }
    onClose();
  };

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 193, 7, 0.1)' }]}>
            <Lock size={32} color="#FFC107" />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.foreground }]}>
            {t('freemium.limitReached') || `You've Reached ${transactionLimit} Transactions`}
          </Text>

          {/* Description */}
          <Text style={[styles.description, { color: colors.mutedForeground }]}>
            {t('freemium.limitDescription') ||
              "You're doing great with tracking your finances! To add more transactions and unlock all features, consider upgrading to Premium."}
          </Text>

          {/* Features List */}
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
                <Zap size={16} color="#4CAF50" />
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: colors.foreground }]}>
                  {t('freemium.unlimitedTransactions') || 'Unlimited Transactions'}
                </Text>
                <Text style={[styles.featureDescription, { color: colors.mutedForeground }]}>
                  {t('freemium.unlimitedTransactionsDesc') ||
                    'Track as many expenses and income as you want'}
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(3, 169, 244, 0.1)' }]}>
                <PieChart size={16} color="#03A9F4" />
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: colors.foreground }]}>
                  {t('freemium.advancedAnalytics') || 'Advanced Analytics'}
                </Text>
                <Text style={[styles.featureDescription, { color: colors.mutedForeground }]}>
                  {t('freemium.advancedAnalyticsDesc') ||
                    'Get detailed insights and custom reports'}
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(156, 39, 176, 0.1)' }]}>
                <TrendingUp size={16} color="#9C27B0" />
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: colors.foreground }]}>
                  {t('freemium.investmentPortfolio') || 'Investment Portfolio'}
                </Text>
                <Text style={[styles.featureDescription, { color: colors.mutedForeground }]}>
                  {t('freemium.investmentPortfolioDesc') ||
                    'Full investment tracking with no limits'}
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(255, 152, 0, 0.1)' }]}>
                <Calendar size={16} color="#FF9800" />
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: colors.foreground }]}>
                  {t('freemium.prioritySupport') || 'Priority Support'}
                </Text>
                <Text style={[styles.featureDescription, { color: colors.mutedForeground }]}>
                  {t('freemium.prioritySupportDesc') || 'Get help whenever you need it'}
                </Text>
              </View>
            </View>
          </View>

          {/* Price Card */}
          <View
            style={[
              styles.priceCard,
              {
                backgroundColor: isDark ? 'rgba(3, 169, 244, 0.2)' : 'rgba(3, 169, 244, 0.1)',
              },
            ]}
          >
            <Text style={[styles.priceLabel, { color: colors.primary }]}>
              {t('freemium.premiumPlan') || 'Premium Plan'}
            </Text>
            <View style={styles.priceRow}>
              <Text style={[styles.priceSymbol, { color: colors.primary }]}>$</Text>
              <Text style={[styles.priceAmount, { color: colors.primary }]}>9.99</Text>
              <Text style={[styles.pricePeriod, { color: colors.primary }]}>/month</Text>
            </View>
            <Text style={[styles.priceNote, { color: colors.mutedForeground }]}>
              {t('freemium.cancelAnytime') || 'Cancel anytime'}
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <Button
              title={t('freemium.upgradeToPremium') || 'Upgrade to Premium'}
              onPress={handleUpgrade}
              variant="primary"
              fullWidth
            />
            <Pressable onPress={onClose} style={styles.continueButton}>
              <Text style={[styles.continueButtonText, { color: colors.mutedForeground }]}>
                {t('freemium.continueFree') || 'Continue in Free Mode'}
              </Text>
            </Pressable>
          </View>

          {/* Footer Note */}
          <Text style={[styles.footerNote, { color: colors.mutedForeground }]}>
            {t('freemium.safeNote', { count: transactionCount }) ||
              `Don't worry! Your existing ${transactionCount} transactions are safe. You can view and manage them anytime.`}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  featuresList: {
    width: '100%',
    marginBottom: 24,
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  priceCard: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  priceSymbol: {
    fontSize: 16,
    marginRight: 2,
  },
  priceAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: fonts.mono,
  },
  pricePeriod: {
    fontSize: 14,
    marginLeft: 4,
  },
  priceNote: {
    fontSize: 12,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  upgradeButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 14,
  },
  footerNote: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
    lineHeight: 16,
  },
});

