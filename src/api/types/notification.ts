export interface Notification {
  id: number;
  type: 'transaction_limit' | 'recurring_payment' | 'pro_expiration' | 'referral_reward' | 'investment_reminder';
  title: string;
  message: string;
  data?: Record<string, any>;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationFilters {
  per_page?: number;
  page?: number;
  is_read?: boolean;
}

