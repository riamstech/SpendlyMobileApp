import { Platform } from 'react-native';
import * as RNIap from 'react-native-iap';

// Product IDs from App Store Connect
export const SUBSCRIPTION_PRODUCTS = {
  MONTHLY: 'com.spendly.mobile.pro.monthly',
  YEARLY: 'com.spendly.mobile.pro.yearly',
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
      console.log('[IAP] Skipping initialization - not on iOS');
      return;
    }

    if (this.isInitialized) {
      console.log('[IAP] Already initialized');
      return;
    }

    try {
      await RNIap.initConnection();
      console.log('[IAP] Connection initialized');

      // Set up purchase listeners
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
      const products = await RNIap.fetchProducts({ skus: PRODUCT_IDS });
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
  async purchaseSubscription(productId: string): Promise<void> {
    if (Platform.OS !== 'ios') {
      console.log('[IAP] Skipping purchase - not on iOS');
      return;
    }

    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('[IAP] Requesting purchase for:', productId);
      
      // v14 Nitro API: Must pass object with 'request' (productId) and 'type'
      await (RNIap.requestPurchase as any)({
        request: productId,
        type: 'subs', // 'subs' for subscriptions, 'in-app' for one-time purchases
      });
      
      console.log('[IAP] Purchase request sent');
    } catch (error: any) {
      console.error('[IAP] Error purchasing subscription:', error);
      
      if (error.code === 'E_USER_CANCELLED') {
        console.log('[IAP] User cancelled the purchase');
      }
      
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
      async (purchase: any) => {
        console.log('[IAP] Purchase updated:', purchase);
        
        const receipt = purchase.transactionReceipt;
        if (receipt) {
          try {
            // Send receipt to backend for verification
            await this.verifyPurchase(purchase);

            // Finish the transaction
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
