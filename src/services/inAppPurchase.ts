import { Platform, Alert, DeviceEventEmitter } from 'react-native';
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
      await this.getProducts();
      
      // Clear any pending transactions to prevent duplicate purchase dialogs
      try {
        const pendingPurchases = await RNIap.getAvailablePurchases();
        if (pendingPurchases && pendingPurchases.length > 0) {
          for (const purchase of pendingPurchases) {
            await RNIap.finishTransaction({ purchase, isConsumable: false });
          }
        }
      } catch (pendingError) {
      }
    } catch (error) {
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
      
      // Use 'all' type to catch both products and subscriptions
      const products = await RNIap.fetchProducts({ 
        skus: PRODUCT_IDS,
        type: 'all' as any // Using 'all' ensures we catch any classification
      });

      if (!products || products.length === 0) {
        return [];
      }

      for (let i = 0; i < products.length; i++) {
        const p = products[i];
      }
      
      return products;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Purchase a subscription
   */
  async purchaseSubscription(productId: string): Promise<void> {
    
    if (Platform.OS !== 'ios') {
      return;
    }

    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      
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
      
    } catch (error: any) {
      
      // Show user-friendly error (Alert is already imported)
      if (error.message?.includes('Sandbox account')) {
        Alert.alert(
          'Sandbox Account Required',
          'To test purchases, please sign in to a Sandbox test account:\n\n1. Open Settings app\n2. Go to App Store\n3. Scroll to "Sandbox Account"\n4. Sign in with your test account',
          [{ text: 'OK' }]
        );
      } else if (error.message?.includes('dialog did not appear')) {
        // Timeout error - silently ignore, user likely backed out
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
      throw error;
    }
  }

  /**
   * Set up purchase listeners
   */
  private setupPurchaseListeners(): void {
    
    this.purchaseUpdateSubscription = RNIap.purchaseUpdatedListener(
      async (purchase: any) => {
        
        // In react-native-iap v14 with StoreKit 2, the receipt is in purchaseToken (JWT)
        const receipt = purchase.purchaseToken || purchase.transactionReceipt;
        
        if (receipt) {
          try {
            await this.verifyPurchase(purchase);
            await RNIap.finishTransaction({ purchase, isConsumable: false });
          } catch (error) {
          }
        } else {
        }
      }
    );

    this.purchaseErrorSubscription = RNIap.purchaseErrorListener(
      (error: any) => {
      }
    );
    
  }

  /**
   * Verify purchase with backend
   */
  private async verifyPurchase(purchase: any): Promise<void> {

    try {
      // Import apiClient from correct location
      const { apiClient } = await import('../api/client');
      
      // Get the receipt (StoreKit 2 uses purchaseToken, StoreKit 1 uses transactionReceipt)
      const receipt = purchase.purchaseToken || purchase.transactionReceipt;
      
      // Send receipt to backend for verification
      const result = await apiClient.post('/iap/verify-ios', {
        receipt: receipt,
        productId: purchase.productId,
        transactionId: purchase.transactionId,
      });

      
      // Refresh user data to get updated license
      try {
        const { authService } = await import('../api/services/auth');
        const updatedUser = await authService.getCurrentUser();
        
        // Emit event to notify UI components to refresh
        DeviceEventEmitter.emit('userDataUpdated', updatedUser);
        DeviceEventEmitter.emit('purchaseCompleted');
      } catch (refreshError) {
      }
      
      // Show success message
      Alert.alert(
        'Purchase Successful! 🎉',
        'Your subscription has been activated and your license has been extended!',
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      
      // Show error to user
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
      this.isInitialized = false;
    } catch (error) {
    }
  }
}

export const iapService = new InAppPurchaseService();
