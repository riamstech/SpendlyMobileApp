import { Platform } from 'react-native';
import * as RNIap from 'react-native-iap';
import type {
  Product,
  Purchase,
  PurchaseError,
  SubscriptionPurchase,
} from 'react-native-iap';

// Product IDs from App Store Connect
export const SUBSCRIPTION_PRODUCTS = {
  MONTHLY: 'com.spendly.mobile.pro.monthly',
  YEARLY: 'com.spendly.mobile.pro.yearly',
} as const;

export const PRODUCT_IDS = Object.values(SUBSCRIPTION_PRODUCTS);

class InAppPurchaseService {
  private purchaseUpdateSubscription: any = null;
  private purchaseErrorSubscription: any = null;

  /**
   * Initialize the IAP connection
   */
  async initialize(): Promise<void> {
    if (Platform.OS !== 'ios') {
      console.log('[IAP] Skipping initialization - not on iOS');
      return;
    }

    try {
      await RNIap.initConnection();
      console.log('[IAP] Connection initialized');

      // Set up purchase listeners
      this.setupPurchaseListeners();

      // Finish any pending transactions
      await this.finishPendingTransactions();
    } catch (error) {
      console.error('[IAP] Error initializing connection:', error);
      throw error;
    }
  }

  /**
   * Get available subscription products
   */
  async getProducts(): Promise<Product[]> {
    if (Platform.OS !== 'ios') {
      return [];
    }

    try {
      const products = await RNIap.getSubscriptions({ skus: PRODUCT_IDS });
      console.log('[IAP] Available products:', products);
      return products;
    } catch (error) {
      console.error('[IAP] Error getting products:', error);
      throw error;
    }
  }

  /**
   * Purchase a subscription
   */
  async purchaseSubscription(productId: string): Promise<Purchase | null> {
    if (Platform.OS !== 'ios') {
      console.log('[IAP] Skipping purchase - not on iOS');
      return null;
    }

    try {
      console.log('[IAP] Requesting purchase for:', productId);
      await RNIap.requestSubscription({ sku: productId });
      // Purchase result will be handled by the listener
      return null;
    } catch (error) {
      console.error('[IAP] Error purchasing subscription:', error);
      throw error;
    }
  }

  /**
   * Restore purchases
   */
  async restorePurchases(): Promise<Purchase[]> {
    if (Platform.OS !== 'ios') {
      return [];
    }

    try {
      const purchases = await RNIap.getAvailablePurchases();
      console.log('[IAP] Restored purchases:', purchases);
      return purchases;
    } catch (error) {
      console.error('[IAP] Error restoring purchases:', error);
      throw error;
    }
  }

  /**
   * Set up purchase listeners
   */
  private setupPurchaseListeners(): void {
    // Purchase update listener
    this.purchaseUpdateSubscription = RNIap.purchaseUpdatedListener(
      async (purchase: SubscriptionPurchase) => {
        console.log('[IAP] Purchase updated:', purchase);
        
        const receipt = purchase.transactionReceipt;
        if (receipt) {
          try {
            // Send receipt to backend for verification
            await this.verifyPurchase(purchase);

            // Acknowledge the purchase
            await RNIap.finishTransaction({ purchase, isConsumable: false });
            console.log('[IAP] Purchase finished successfully');
          } catch (error) {
            console.error('[IAP] Error verifying purchase:', error);
          }
        }
      }
    );

    // Purchase error listener  
    this.purchaseErrorSubscription = RNIap.purchaseErrorListener(
      (error: PurchaseError) => {
        console.error('[IAP] Purchase error:', error);
      }
    );
  }

  /**
   * Verify purchase with backend
   */
  private async verifyPurchase(purchase: SubscriptionPurchase): Promise<void> {
    // This will be implemented to call your backend API
    // For now, just log it
    console.log('[IAP] Verifying purchase with backend:', {
      productId: purchase.productId,
      transactionId: purchase.transactionId,
      transactionReceipt: purchase.transactionReceipt,
    });

    // TODO: Call backend API to verify receipt
    // await subscriptionsService.verifyApplePurchase({
    //   receiptData: purchase.transactionReceipt,
    //   transactionId: purchase.transactionId,
    //   productId: purchase.productId,
    // });
  }

  /**
   * Finish any pending transactions
   */
  private async finishPendingTransactions(): Promise<void> {
    try {
      await RNIap.flushFailedPurchasesCachedAsPendingAndroid();
      console.log('[IAP] Pending transactions cleared');
    } catch (error) {
      console.error('[IAP] Error clearing pending transactions:', error);
    }
  }

  /**
   * Clean up and end connection
   */
  async cleanup(): Promise<void> {
    if (this.purchaseUpdateSubscription) {
      this.purchaseUpdateSubscription.remove();
      this.purchaseUpdateSubscription = null;
    }

    if (this.purchaseErrorSubscription) {
      this.purchaseErrorSubscription.remove();
      this.purchaseErrorSubscription = null;
    }

    try {
      await RNIap.endConnection();
      console.log('[IAP] Connection ended');
    } catch (error) {
      console.error('[IAP] Error ending connection:', error);
    }
  }
}

export const iapService = new InAppPurchaseService();
