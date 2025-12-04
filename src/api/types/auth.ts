export interface LoginRequest {
  email: string;
  password: string;
  device_name: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  default_currency: string;
  device_name: string;
  referral_code?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface User {
  id: number;
  name: string;
  email: string;
  defaultCurrency: string;
  preferredLocale?: string;
  role: string;
  proStatus: boolean;
  isPro: boolean;
  transactionCount?: number;
  transactionLimit?: number | null;
  licenseStartDate: string | null;
  licenseEndDate: string | null;
  referralCode: string;
  referredBy: number | null;
  avatar?: string;
  country?: string | null;
  state?: string | null;
  settings?: UserSettings;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  darkMode: boolean;
  notificationsEnabled: boolean;
  biometricLockEnabled: boolean;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  password: string;
  password_confirmation: string;
}

