export interface UpdateUserRequest {
  name?: string;
  email?: string;
  defaultCurrency?: string;
  country?: string;
  state?: string;
}

export interface UpdateUserSettingsRequest {
  dark_mode?: boolean;
  notifications_enabled?: boolean;
  biometric_lock_enabled?: boolean;
  budget_cycle_day?: number;
  preferred_locale?: string;
}

export interface UserSettingsResponse {
  settings: {
    darkMode: boolean;
    notificationsEnabled: boolean;
    biometricLockEnabled: boolean;
    budgetCycleDay: number;
  };
}

export interface BackupDataResponse {
  user: {
    name: string;
    email: string;
    defaultCurrency: string;
    createdAt: string;
  };
  transactions: any[];
  investments: any[];
  recurringPayments: any[];
  exportedAt: string;
}

// Re-export User type from auth for convenience
export type { User } from './auth';

