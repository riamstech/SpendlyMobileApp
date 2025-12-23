import { Platform, Alert, DeviceEventEmitter } from 'react-native';
import * as RNIap from 'react-native-iap';

// Product IDs from App Store Connect (Consumable products for validity extensions)
export const SUBSCRIPTION_PRODUCTS = {
  MONTHLY: 'com.spendly.mobile.premium.monthlyextension',
  YEARLY: 'com.spendly.mobile.premium.yearlyextension',
} as const;

export const PRODUCT_IDS = Object.values(SUBSCRIPTION_PRODUCTS);

export interface ProductPrice {
  productId: string;
  price: string;
  localizedPrice: string;
  currency: string;
}

class InAppPurchaseService {
  private purchaseUpdateSubscription: any = null;
  private purchaseErrorSubscription: any = null;
  private isInitialized = false;
  private cachedPrices: Map<string, ProductPrice> = new Map();
  private isPurchasing = false;
  private isRestoring = false;
  private processedTransactionIds: Set<string> = new Set();

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
      
      // Mark all existing purchases as processed to prevent false success alerts
      // This ensures only NEW purchases trigger the success dialog
      try {
        this.isRestoring = true;
        const existingPurchases = await RNIap.getAvailablePurchases();
        for (const purchase of existingPurchases) {
          const transactionId = (purchase as any).transactionId || (purchase as any).id;
          if (transactionId) {
            this.processedTransactionIds.add(transactionId);
            console.log('IAP: Marked existing transaction as processed:', transactionId);
          }
        }
      } catch (e) {
        console.warn('Error marking existing purchases:', e);
      } finally {
        this.isRestoring = false;
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

      // Cache prices for later use
      for (const product of products) {
        const p = product as any;
        const productId = p.productId || p.id || '';
        this.cachedPrices.set(productId, {
          productId: productId,
          price: String(p.price || '0'),
          localizedPrice: p.localizedPrice || String(p.price) || '$0.00',
          currency: p.currency || 'USD',
        });
      }
      
      return products;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Get formatted price for a product from App Store
   */
  async getProductPrice(productId: string): Promise<ProductPrice | null> {
    // Check cache first
    if (this.cachedPrices.has(productId)) {
      return this.cachedPrices.get(productId) || null;
    }

    // Fetch products if not cached
    await this.getProducts();
    return this.cachedPrices.get(productId) || null;
  }

  /**
   * Get all cached prices
   */
  getCachedPrices(): Map<string, ProductPrice> {
    return this.cachedPrices;
  }

  /**
   * Check if a purchase is in progress
   */
  isPurchaseInProgress(): boolean {
    return this.isPurchasing;
  }

  /**
   * Check if user has an active subscription
   * Returns the active subscription product ID or null
   */
  async getActiveSubscription(): Promise<string | null> {
    if (Platform.OS !== 'ios') {
      return null;
    }

    try {
      const purchases = await RNIap.getAvailablePurchases();
      for (const purchase of purchases) {
        const productId = (purchase as any).productId;
        if (PRODUCT_IDS.includes(productId)) {
          return productId;
        }
      }
      return null;
    } catch (error) {
      console.warn('Error checking active subscription:', error);
      return null;
    }
  }

  /**
   * Purchase a subscription
   */
  async purchaseSubscription(productId: string): Promise<void> {
    
    if (Platform.OS !== 'ios') {
      return;
    }

    if (this.isPurchasing) {
      return; // Prevent duplicate purchases
    }

    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      this.isPurchasing = true;
      DeviceEventEmitter.emit('purchaseStarted');
      
      console.log('IAP: Initiating new purchase for:', productId);
      
      // For react-native-iap v14+, use sku directly
      await RNIap.requestPurchase({
        sku: productId,
        type: 'in-app',
      });
      
    } catch (error: any) {
      
      // Handle user cancellation silently
      if (error.code === 'E_USER_CANCELLED') {
        return;
      }
      
      // Show user-friendly error for other cases
      Alert.alert(
        'Purchase Error',
        error.message || 'Failed to initiate purchase. Please try again.',
        [{ text: 'OK' }]
      );
      
      throw error;
    } finally {
      this.isPurchasing = false;
      DeviceEventEmitter.emit('purchaseEnded');
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
        const transactionId = purchase.transactionId || purchase.id;
        
        // Skip if this transaction was already processed (restored purchase)
        if (transactionId && this.processedTransactionIds.has(transactionId)) {
          console.log('IAP: Skipping already processed transaction:', transactionId);
          await RNIap.finishTransaction({ purchase, isConsumable: true });
          return;
        }
        
        // Skip if we're in restore mode (not a new purchase)
        if (this.isRestoring) {
          console.log('IAP: Skipping transaction during restore');
          await RNIap.finishTransaction({ purchase, isConsumable: true });
          return;
        }
        
        // In react-native-iap v14 with StoreKit 2, the receipt is in purchaseToken (JWT)
        const receipt = purchase.purchaseToken || purchase.transactionReceipt;
        
        if (receipt) {
          try {
            // Mark as processed before verification
            if (transactionId) {
              this.processedTransactionIds.add(transactionId);
            }
            
            // This is a NEW purchase - verify and show success
            await this.verifyPurchase(purchase, true);
            // Use isConsumable: true to allow users to buy validity extensions multiple times
            await RNIap.finishTransaction({ purchase, isConsumable: true });
          } catch (error) {
            console.error('IAP: Error processing purchase:', error);
          }
        } else {
          console.warn('IAP: No receipt found in purchase');
        }
      }
    );

    this.purchaseErrorSubscription = RNIap.purchaseErrorListener(
      (error: any) => {
        console.error('IAP: Purchase error:', error);
      }
    );
    
  }

  /**
   * Verify purchase with backend
   * @param purchase - The purchase object from StoreKit
   * @param showSuccessAlert - Whether to show success alert (false for restores)
   */
  private async verifyPurchase(purchase: any, showSuccessAlert: boolean = true): Promise<void> {

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
      
      // Show success message only for new purchases (not restores)
      if (showSuccessAlert) {
        Alert.alert(
          'Purchase Successful! 🎉',
          'Your subscription has been activated and your license has been extended!',
          [{ text: 'OK' }]
        );
      }
      
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
