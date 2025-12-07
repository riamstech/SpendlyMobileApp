import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
  Alert,
  ScrollView,
  Modal as RNModal,
} from 'react-native';
import { CreditCard, X, AlertCircle, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { textStyles, createResponsiveTextStyles } from '../constants/fonts';
import { subscriptionsService } from '../api/services/subscriptions';
import * as Linking from 'expo-linking';

interface StripePaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  planType: 'monthly' | 'yearly';
  paymentMethod: 'card' | 'upi';
  onSuccess?: () => void;
  monthlyPrice?: string;
  yearlyPrice?: string;
}

export default function StripePaymentDialog({
  isOpen,
  onClose,
  planType: initialPlanType,
  paymentMethod,
  onSuccess,
  monthlyPrice,
  yearlyPrice,
}: StripePaymentDialogProps) {
  const { t } = useTranslation('common');
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for plan selection
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>(initialPlanType);

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use checkout session (URL) for all payment methods on mobile
      // This supports both Stripe Checkout and Razorpay Payment Links (if implemented on backend)
      const checkout = await subscriptionsService.checkout(selectedPlan, paymentMethod);
      
      if (checkout.checkout_url) {
        // Open the checkout URL in system browser
        const canOpen = await Linking.canOpenURL(checkout.checkout_url);
        if (canOpen) {
          await Linking.openURL(checkout.checkout_url);
          onSuccess?.(); // Optimistically call success or wait for deep link return?
          // Usually we want to wait, but here we just close the dialog
          onClose(); 
        } else {
          throw new Error('Cannot open payment URL');
        }
      } else {
        throw new Error('No checkout URL returned');
      }

    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || t('payment.failed') || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const responsiveTextStyles = createResponsiveTextStyles(width);
  
  // Default fallbacks if props not provided
  const displayMonthlyPrice = monthlyPrice || '$1.99';
  const displayYearlyPrice = yearlyPrice || '$9.99';

  const PlanOption = ({ type, price, save }: { type: 'monthly' | 'yearly', price: string, save?: string }) => {
    const isSelected = selectedPlan === type;
    const borderColor = isSelected ? colors.primary : colors.border;
    const backgroundColor = isSelected ? colors.primary + '10' : 'transparent';

    return (
      <Pressable
        onPress={() => setSelectedPlan(type)}
        style={[
          styles.planOption,
          { borderColor, backgroundColor },
        ]}
      >
        <View style={styles.planInfo}>
          <Text style={[styles.planType, { color: colors.foreground }]}>
            {type === 'monthly' ? (t('payment.monthly') || 'Monthly') : (t('payment.yearly') || 'Yearly')}
          </Text>
          <Text style={[styles.planPrice, { color: colors.mutedForeground }]}>
            {price}
          </Text>
        </View>
        {isSelected && (
          <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
            <Check size={12} color="#fff" />
          </View>
        )}
        {save && (
           <View style={[styles.saveBadge, { backgroundColor: '#4CAF50' }]}>
             <Text style={styles.saveBadgeText}>{save}</Text>
           </View>
        )}
      </Pressable>
    );
  };

  return (
    <RNModal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary + '1A' }]}>
                <CreditCard size={24} color={colors.primary} />
              </View>
              <View style={styles.headerText}>
                <Text style={[styles.title, responsiveTextStyles.h3, { color: colors.foreground }]}>
                  {paymentMethod === 'upi' 
                    ? t('payment.payWithUPI') || 'Pay with UPI'
                    : t('payment.payWithCard') || 'Pay with Card'}
                </Text>
                <Text style={[styles.description, responsiveTextStyles.bodySmall, { color: colors.mutedForeground }]}>
                  {t('settings.upgradeDescription') || 'Unlock unlimited features'}
                </Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <X size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Plan Selection */}
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {t('payment.selectPlan') || 'Select Plan'}
            </Text>
            
            <View style={styles.plansContainer}>
              <PlanOption type="monthly" price={`${displayMonthlyPrice}/mo`} />
              <PlanOption type="yearly" price={`${displayYearlyPrice}/yr`} save="Save 58%" />
            </View>

            {/* Error Message */}
            {error && (
              <View style={[styles.errorCard, { backgroundColor: colors.destructive + '1A', borderColor: colors.destructive }]}>
                <AlertCircle size={20} color={colors.destructive} />
                <Text style={[styles.errorText, { color: colors.destructive }]}>
                  {error}
                </Text>
              </View>
            )}

            {/* Note */}
            <View style={[styles.noteCard, { backgroundColor: colors.muted }]}>
              <Text style={[styles.noteText, { color: colors.mutedForeground }]}>
                {t('payment.mobileNote') || 'You will be redirected to complete your payment securely.'}
              </Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.cancelButton,
                { backgroundColor: colors.muted, borderColor: colors.border },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={[styles.cancelButtonText, responsiveTextStyles.button, { color: colors.foreground }]}>
                {t('common.cancel') || 'Cancel'}
              </Text>
            </Pressable>
            <Pressable
              onPress={handlePayment}
              disabled={loading}
              style={({ pressed }) => [
                styles.payButton,
                { backgroundColor: colors.primary },
                (loading || pressed) && { opacity: 0.8 },
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.primaryForeground} />
              ) : (
                <Text style={[styles.payButtonText, responsiveTextStyles.button, { color: colors.primaryForeground }]}>
                  {t('payment.payNow') || 'Pay Now'} • {selectedPlan === 'monthly' ? displayMonthlyPrice : displayYearlyPrice}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  modalContent: {
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    zIndex: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    lineHeight: 18,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
    fontSize: 16,
  },
  plansContainer: {
    gap: 12,
    marginBottom: 20,
  },
  planOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  planInfo: {
    flex: 1,
  },
  planType: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 14,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  saveBadge: {
    position: 'absolute',
    top: -10,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  saveBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    ...textStyles.caption,
    lineHeight: 18,
  },
  noteCard: {
    borderRadius: 8,
    padding: 12,
  },
  noteText: {
    ...textStyles.caption,
    lineHeight: 16,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontWeight: '600',
  },
  payButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  payButtonText: {
    fontWeight: 'bold',
  },
});
