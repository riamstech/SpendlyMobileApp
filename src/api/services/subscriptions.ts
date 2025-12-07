import { apiClient } from '../client';
import { config } from '../../config/env';

export interface CheckoutResponse {
  checkout_url: string;
  session_id: string;
}

export const subscriptionsService = {
  async checkout(planType: 'monthly' | 'yearly', paymentMethod?: 'card' | 'upi', amount?: number, currency?: string): Promise<CheckoutResponse> {
    try {
      const token = apiClient.getToken();
      
      const payload: any = {
        plan_type: planType,
        payment_method: paymentMethod,
        success_url: 'spendly://settings?payment=success',
        cancel_url: 'spendly://settings?payment=cancel',
      };

      if (amount && currency) {
        payload.amount = amount;
        payload.currency = currency.toLowerCase();
      }
      
      console.log('Checkout payload:', JSON.stringify(payload));
      
      const response = await fetch(`${config.apiBaseUrl}/pro-subscriptions/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Checkout failed: ${response.status} ${text}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in subscriptionsService.checkout:', error);
      throw error;
    }
  },

  async createPaymentIntent(
    planType: 'monthly' | 'yearly', 
    paymentMethod: 'card' | 'upi',
    amount?: number,
    currency?: string
  ): Promise<{ 
    clientSecret?: string; 
    publishableKey?: string;
    provider?: 'stripe' | 'razorpay';
    orderId?: string;
    key?: string;
    amount?: number;
    currency?: string;
    checkout_url?: string; // For Razorpay Payment Link
    prefill?: {
      name?: string;
      email?: string;
      contact?: string;
    };
  }> {
    try {
      const token = apiClient.getToken();
      
      const body: any = {
        plan_type: planType,
        payment_method: paymentMethod,
      };
      
      // Include amount and currency if provided (for dynamic pricing based on user's country)
      if (amount !== undefined && currency) {
        body.amount = amount;
        body.currency = currency.toLowerCase(); // Stripe requires lowercase currency codes
      }
      
      const response = await fetch(`${config.apiBaseUrl}/payment-intents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Payment intent creation failed: ${response.status} ${text}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in subscriptionsService.createPaymentIntent:', error);
      throw error;
    }
  },

  async verifyPayment(params: any): Promise<any> {
    try {
        const token = apiClient.getToken();
        const response = await fetch(`${config.apiBaseUrl}/razorpay/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(params)
        });
        
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Verification failed: ${response.status} ${text}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error in subscriptionsService.verifyPayment:', error);
        throw error;
    }
  }
};
