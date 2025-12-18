import { Platform } from 'react-native';
import * as RNIap from 'react-native-iap';

// Product IDs from App Store Connect
export const SUBSCRIPTION_PRODUCTS = {
  MONTHLY: 'com.spendly.mobile.premium.monthly',
  YEARLY: 'com.spendly.mobile.premium.yearly',
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
      
      // Pre-fetch products to warm up cache and verify connection
      console.log('[IAP] Initialized. Pre-fetching products...');
      await this.getProducts();
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
      
      // Use 'all' type to catch both products and subscriptions
      const products = await RNIap.fetchProducts({ 
        skus: PRODUCT_IDS,
        type: 'all' as any // Using 'all' ensures we catch any classification
      });

      if (!products || products.length === 0) {
        console.warn('[IAP] WARNING: Apple returned ZERO products for type "all".');
        return [];
      }

      console.log('[IAP] Products successfully loaded:', products.length);
      for (let i = 0; i < products.length; i++) {
        const p = products[i];
        console.log(` - ${p.id}: ${p.price} ${p.currency} (Type: ${p.type})`);
      }
      
      return products;
    } catch (error: any) {
      console.error('[IAP] Error getting products from Apple:', error);
      if (error.debugMessage) console.error('[IAP] Debug Message:', error.debugMessage);
      throw error;
    }
  }

  /**
   * Purchase a subscription
   */
  async purchaseSubscription(productId: string): Promise<void> {
    console.log('[IAP] ===== PURCHASE INITIATED =====');
    console.log('[IAP] Product ID:', productId);
    
    if (Platform.OS !== 'ios') {
      console.log('[IAP] Not on iOS, skipping...');
      return;
    }

    if (!this.isInitialized) {
      console.log('[IAP] Not initialized, initializing now...');
      await this.initialize();
    }

    try {
      console.log('[IAP] Calling requestPurchase for:', productId);
      
      // Set a flag to track if purchase dialog appears
      let purchaseStarted = false;
      
      const purchasePromise = (RNIap.requestPurchase as any)({
        request: {
          ios: { sku: productId },
          android: { skus: [productId] },
        },
        type: 'in-app',
      });

      // Add a timeout to detect if StoreKit silently fails
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          if (!purchaseStarted) {
            reject(new Error('Purchase dialog did not appear after 2 seconds. Please ensure you are signed into a Sandbox account in Settings > App Store > Sandbox Account.'));
          }
        }, 2000);
      });

      await Promise.race([purchasePromise, timeoutPromise]);
      
      console.log('[IAP] requestPurchase completed successfully');
    } catch (error: any) {
      console.error('[IAP] Error purchasing subscription:', error);
      console.error('[IAP] Error details:', JSON.stringify(error));
      
      // Show user-friendly error
      const { Alert } = await import('react-native');
      
      if (error.message?.includes('Sandbox account')) {
        Alert.alert(
          'Sandbox Account Required',
          'To test purchases, please sign in to a Sandbox test account:\n\n1. Open Settings app\n2. Go to App Store\n3. Scroll to "Sandbox Account"\n4. Sign in with your test account',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Purchase Error',
          error.message || 'Failed to initiate purchase. Please try again.',
          [{ text: 'OK' }]
        );
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
    console.log('[IAP] Verifying purchase with backend:', {
      productId: purchase.productId,
      transactionId: purchase.transactionId,
    });

    try {
      // Import apiClient from correct location
      const { apiClient } = await import('../api/client');
      
      // Send receipt to backend for verification
      const result = await apiClient.post('/iap/verify-ios', {
        receipt: purchase.transactionReceipt,
        productId: purchase.productId,
        transactionId: purchase.transactionId,
      });

      console.log('[IAP] Purchase verified successfully:', (result as any).data);
      
      // Import Alert to show success message
      const { Alert } = await import('react-native');
      Alert.alert(
        'Purchase Successful! 🎉',
        'Your subscription has been activated. Please close and reopen the app to see your updated license.',
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('[IAP] Backend verification failed:', error);
      
      // Show error to user
      const { Alert } = await import('react-native');
      Alert.alert(
        'Verification Error',
        'Your payment was received but we couldn\'t verify it with our servers. Please contact support if your subscription doesn\'t appear within 24 hours.',
        [{ text: 'OK' }]
      );
      
      throw error;
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
      this.isInitialized = false;
    } catch (error) {
      console.error('[IAP] Error ending connection:', error);
    }
  }
}

export const iapService = new InAppPurchaseService();
