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
} from 'react-native';
import { Modal } from './ui';
import { CreditCard, X, AlertCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { subscriptionsService } from '../api/services/subscriptions';
import * as Linking from 'expo-linking';

// Note: For React Native, you need to install @stripe/stripe-react-native
// npm install @stripe/stripe-react-native
// For iOS: cd ios && pod install
// 
// For now, this component will use a web-based approach via Linking
// In production, you should use the native Stripe SDK

interface StripePaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  planType: 'monthly' | 'yearly';
  paymentMethod: 'card' | 'upi';
  onSuccess?: () => void;
}

export default function StripePaymentDialog({
  isOpen,
  onClose,
  planType,
  paymentMethod,
  onSuccess,
}: StripePaymentDialogProps) {
  const { t } = useTranslation('common');
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create payment intent
      const paymentData = await subscriptionsService.createPaymentIntent(
        planType,
        paymentMethod
      );

      if (paymentData.clientSecret && paymentData.publishableKey) {
        // For React Native, we'll use Stripe's Payment Sheet or redirect to web
        // For now, we'll show a message that payment processing is being set up
        // In production, integrate @stripe/stripe-react-native here
        
        Alert.alert(
          t('payment.processing') || 'Processing Payment',
          t('payment.redirectingToStripe') || 'You will be redirected to complete your payment.',
          [
            {
              text: t('common.cancel') || 'Cancel',
              style: 'cancel',
              onPress: onClose,
            },
            {
              text: t('payment.continue') || 'Continue',
              onPress: async () => {
                // For now, use checkout URL as fallback
                try {
                  const checkout = await subscriptionsService.checkout(planType, paymentMethod);
                  if (checkout.checkout_url) {
                    await Linking.openURL(checkout.checkout_url);
                    onSuccess?.();
                    onClose();
                  }
                } catch (err: any) {
                  setError(err.message || t('payment.failed') || 'Payment failed');
                }
              },
            },
          ]
        );
      } else if (paymentData.provider === 'razorpay' && paymentData.orderId) {
        // Handle Razorpay if needed
        Alert.alert(
          t('payment.razorpay') || 'Razorpay Payment',
          t('payment.razorpayNotSupported') || 'Razorpay integration for mobile is coming soon.',
          [{ text: t('common.ok') || 'OK', onPress: onClose }]
        );
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || t('payment.failed') || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const responsiveStyles = {
    title: { fontSize: Math.max(18, Math.min(22 * (width / 375), 24)) },
    description: { fontSize: Math.max(12, Math.min(14 * (width / 375), 16)) },
    buttonText: { fontSize: Math.max(14, Math.min(16 * (width / 375), 18)) },
  };

  return (
    <Modal isVisible={isOpen} onClose={onClose}>
      <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary + '1A' }]}>
              <CreditCard size={24} color={colors.primary} />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.title, responsiveStyles.title, { color: colors.foreground }]}>
                {paymentMethod === 'upi' 
                  ? t('payment.payWithUPI') || 'Pay with UPI'
                  : t('payment.payWithCard') || 'Pay with Card'}
              </Text>
              <Text style={[styles.description, responsiveStyles.description, { color: colors.mutedForeground }]}>
                {t('payment.completePlanPayment', { plan: planType }) || `Complete your ${planType} plan payment`}
              </Text>
            </View>
          </View>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <X size={20} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Info Card */}
          <View style={[styles.infoCard, { backgroundColor: colors.muted }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                {t('payment.plan') || 'Plan:'}
              </Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {planType === 'monthly' 
                  ? t('payment.monthly') || 'Monthly'
                  : t('payment.yearly') || 'Yearly'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                {t('payment.method') || 'Method:'}
              </Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {paymentMethod === 'upi' ? 'UPI' : t('payment.card') || 'Card'}
              </Text>
            </View>
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
            <Text style={[styles.cancelButtonText, responsiveStyles.buttonText, { color: colors.foreground }]}>
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
              <Text style={[styles.payButtonText, responsiveStyles.buttonText, { color: colors.primaryForeground }]}>
                {t('payment.payNow') || 'Pay Now'}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    alignSelf: 'center',
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
    maxHeight: 400,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
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
    fontSize: 13,
    lineHeight: 18,
  },
  noteCard: {
    borderRadius: 8,
    padding: 12,
  },
  noteText: {
    fontSize: 12,
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

