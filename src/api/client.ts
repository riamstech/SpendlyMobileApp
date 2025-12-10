import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '../config/env';
import { toCamelCase, toSnakeCase } from './utils/transformers';
import { ApiError } from './types/common';
import i18n from '../i18n';

const TOKEN_KEY = 'spendly_auth_token';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.apiBaseUrl,
      timeout: config.apiTimeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - add token, language header, and transform to snake_case
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Add auth token if available
        const token = this.getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add Accept-Language header with current i18n language
        // This ensures backend translates categories and other content based on app language
        const currentLanguage = i18n.language || 'en';
        if (config.headers) {
          config.headers['Accept-Language'] = currentLanguage;
        }

        // Transform request data to snake_case, except for FormData (file uploads)
        if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
          config.data = toSnakeCase(config.data);
        }

        // Transform query params to snake_case
        if (config.params && typeof config.params === 'object') {
          config.params = toSnakeCase(config.params);
        }

        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - transform to camelCase and handle errors
      this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Transform response data to camelCase
        if (response.data && typeof response.data === 'object') {
          response.data = toCamelCase(response.data);
        }
        return response;
      },
      (error: AxiosError<ApiError>) => {
        // Handle timeout errors
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          console.error(`API Client: Request timed out to ${error.config?.url}. Backend may not be running at ${this.client.defaults.baseURL}`);
        }
        
        // Handle network errors
        if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
          console.error(`API Client: Network error. Cannot reach backend at ${this.client.defaults.baseURL}`);
        }

        // Handle 401 Unauthorized - token expired or invalid
        if (error.response?.status === 401) {
          this.clearToken();
        }

        // Transform error response to camelCase
        if (error.response?.data && typeof error.response.data === 'object') {
          error.response.data = toCamelCase(error.response.data);
        }

        return Promise.reject(error);
      }
    );
  }

  // Token management (AsyncStorage for React Native)
  async setTokenAsync(token: string): Promise<void> {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  }

  async getTokenAsync(): Promise<string | null> {
    return AsyncStorage.getItem(TOKEN_KEY);
  }

  async clearTokenAsync(): Promise<void> {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }

  // Synchronous wrappers used by interceptors (best‑effort cache)
  private tokenCache: string | null = null;

  setToken(token: string): void {
    this.tokenCache = token;
    // Fire and forget
    this.setTokenAsync(token).catch(console.warn);
  }

  getToken(): string | null {
    return this.tokenCache;
  }

  clearToken(): void {
    this.tokenCache = null;
    this.clearTokenAsync().catch(console.warn);
  }

  isAuthenticated(): boolean {
    return !!this.tokenCache;
  }

  // CSRF token management
  private csrfToken: string | null = null;
  private csrfTokenPromise: Promise<string | null> | null = null;

  private async getCsrfToken(): Promise<string | null> {
    // Return cached token if available
    if (this.csrfToken) {
      return this.csrfToken;
    }

    // If already fetching, return the existing promise
    if (this.csrfTokenPromise) {
      return this.csrfTokenPromise;
    }

    // Fetch CSRF token from Laravel
    this.csrfTokenPromise = (async () => {
      try {
        // Laravel's CSRF token endpoint (if available)
        // For mobile apps, we might need to get it from a cookie or initial request
        const response = await fetch(`${config.apiBaseUrl.replace('/api', '')}/sanctum/csrf-cookie`, {
          method: 'GET',
          credentials: 'include',
        });
        
        // Extract CSRF token from cookie or response
        // For now, return null and let the backend handle it
        // The backend should allow token-based auth without CSRF for mobile apps
        return null;
      } catch (error) {
        console.warn('Failed to fetch CSRF token:', error);
        return null;
      } finally {
        this.csrfTokenPromise = null;
      }
    })();

    return this.csrfTokenPromise;
  }

  // HTTP methods
  async get<T>(url: string, config?: any): Promise<T> {
    console.log(`API Client: Making GET request to ${this.client.defaults.baseURL}${url}`);
    console.log(`API Client: Request config:`, config);
    try {
      const response = await this.client.get<T>(url, config);
      console.log(`API Client: GET response received from ${url}:`, response);
      return response.data;
    } catch (error: any) {
      console.error(`API Client: GET request failed for ${url}:`, error);
      throw error;
    }
  }

  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    console.log(`API Client: Making POST request to ${this.client.defaults.baseURL}${url}`);
    console.log(`API Client: Request data:`, data);
    try {
      const response = await this.client.post<T>(url, data, config);
      console.log(`API Client: POST response received from ${url}:`, response);
      return response.data;
    } catch (error: any) {
      console.error(`API Client: POST request failed for ${url}:`, error);
      if (error.code === 'ECONNABORTED') {
        console.error(`API Client: Request timed out. Check if backend is running at ${this.client.defaults.baseURL}`);
        throw new Error(`Request timed out. Please check if the backend server is running at ${this.client.defaults.baseURL}`);
      }
      throw error;
    }
  }

  async put<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: any): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  // For file uploads (multipart/form-data)
  async postFormData<T>(url: string, formData: FormData, config?: any): Promise<T> {
    // For React Native, we need to let axios automatically set Content-Type with boundary
    // Don't manually set 'Content-Type': 'multipart/form-data' as it breaks the upload
    const headers: any = { ...config?.headers };
    
    // Remove Content-Type if it was set, so axios can set it automatically with boundary
    if (headers['Content-Type']) {
      delete headers['Content-Type'];
    }
    
    const response = await this.client.post<T>(url, formData, {
      ...config,
      headers,
      transformRequest: (data) => {
        // Return FormData as-is - don't transform it
        return data;
      },
    });
    return response.data;
  }
}

export const apiClient = new ApiClient();

