import { Platform } from 'react-native';
import * as RNIap from 'react-native-iap';

// Product IDs from App Store Connect
export const SUBSCRIPTION_PRODUCTS = {
  MONTHLY: 'com.spendly.mobile.pro.1month',
  YEARLY: 'com.spendly.mobile.pro.1year',
} as const;

export const PRODUCT_IDS = Object.values(SUBSCRIPTION_PRODUCTS);

class InAppPurchaseService {
  private purchaseUpdateSubscription: any = null;
  private purchaseErrorSubscription: any = null;
  private isInitialized = false;

  /**
   * Initialize the IAP connection
   */
  async initialize(): Promise<void> {
    if (Platform.OS !== 'ios') {
      return;
    }

    if (this.isInitialized) {
      return;
    }

    try {
      await RNIap.initConnection();
      this.setupPurchaseListeners();
      this.isInitialized = true;
    } catch (error) {
      console.error('[IAP] Error initializing connection:', error);
      throw error;
    }
  }

  /**
   * Get available subscription products
   */
  async getProducts(): Promise<any[]> {
    if (Platform.OS !== 'ios') {
      return [];
    }

    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('[IAP] Fetching products for skus:', PRODUCT_IDS);
      const products = await RNIap.fetchProducts({ skus: PRODUCT_IDS });
      console.log('[IAP] Products received from Apple:', products.length, products);
      return products;
    } catch (error) {
      console.error('[IAP] Error getting products:', error);
      throw error;
    }
  }

  /**
   * Purchase a subscription
   */
  async purchaseSubscription(productId: string): Promise<void> {
    if (Platform.OS !== 'ios') {
      console.log('[IAP] Skipping purchase - not on iOS');
      return;
    }

    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // v14 Nitro API: Non-Renewing Subscriptions use 'inapp' type (not 'subs')
      // Apple treats Non-Renewing Subscriptions as in-app purchases
      await (RNIap.requestPurchase as any)({
        request: {
          ios: { sku: productId },
          android: { skus: [productId] },
        },
        type: 'in-app', // 'in-app' for Non-Renewing, 'subs' for Auto-Renewable
      });
    } catch (error: any) {
      console.error('[IAP] Error purchasing subscription:', error);
      throw error;
    }
  }

  /**
   * Restore purchases
   */
  async restorePurchases(): Promise<any[]> {
    if (Platform.OS !== 'ios') {
      return [];
    }

    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const purchases = await RNIap.getAvailablePurchases();
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
    this.purchaseUpdateSubscription = RNIap.purchaseUpdatedListener(
      async (purchase: any) => {
        const receipt = purchase.transactionReceipt;
        if (receipt) {
          try {
            await this.verifyPurchase(purchase);
            await RNIap.finishTransaction({ purchase, isConsumable: false });
          } catch (error) {
            console.error('[IAP] Error verifying purchase:', error);
          }
        }
      }
    );

    this.purchaseErrorSubscription = RNIap.purchaseErrorListener(
      (error: any) => {
        console.error('[IAP] Purchase error:', error);
      }
    );
  }

  /**
   * Verify purchase with backend
   */
  private async verifyPurchase(purchase: any): Promise<void> {
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
      this.isInitialized = false;
    } catch (error) {
      console.error('[IAP] Error ending connection:', error);
    }
  }
}

export const iapService = new InAppPurchaseService();
