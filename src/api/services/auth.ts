import { apiClient } from '../client';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
} from '../types/auth';

export const authService = {
  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    // Store token after successful registration
    if (response.token) {
      apiClient.setToken(response.token);
    }
    return response;
  },

  /**
   * Login user
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    // Store token after successful login
    if (response.token) {
      apiClient.setToken(response.token);
    }
    return response;
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      // Always clear token even if API call fails
      apiClient.clearToken();
    }
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<{ data: User }>('/auth/me');
    return response.data;
  },

  /**
   * Request password reset
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/auth/forgot-password', data);
  },

  /**
   * Reset password with token
   */
  async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/auth/reset-password', data);
  },

  /**
   * Change password for authenticated user
   */
  async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/auth/change-password', data);
  },
  /**
 * Login with Google
 */
async googleLogin(data: { token: string; device_name: string }): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/social/verify', {
    provider: 'google',
    token: data.token,
    device_name: data.device_name
  });
  // Store token after successful login
  if (response.token) {
    apiClient.setToken(response.token);
  }
  return response;
  },

  /**
   * Login with Apple
   */
  async appleLogin(data: { 
    identityToken: string; 
    user?: { email?: string; familyName?: string; givenName?: string };
    device_name: string 
  }): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/social/verify', {
      provider: 'apple',
      token: data.identityToken,
      user: data.user,
      device_name: data.device_name
    });
    // Store token after successful login
    if (response.token) {
      apiClient.setToken(response.token);
    }
    return response;
  }
};
