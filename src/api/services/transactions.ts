import { apiClient } from '../client';
import {
  Transaction,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  TransactionFilters,
} from '../types/transaction';
import { PaginatedResponse } from '../types/common';
import { transformTransaction, transformTransactionForAPI } from '../utils/transformers';

export const transactionsService = {
  /**
   * Get list of transactions with filters and pagination
   */
  async getTransactions(filters?: TransactionFilters): Promise<PaginatedResponse<Transaction>> {
    return apiClient.get<PaginatedResponse<Transaction>>('/transactions', { params: filters });
  },

  /**
   * Get a single transaction by ID
   */
  async getTransaction(id: number): Promise<Transaction> {
    const transaction = await apiClient.get<Transaction>(`/transactions/${id}`);
    return transformTransaction(transaction);
  },

  /**
   * Create a new transaction
   */
  async createTransaction(data: CreateTransactionRequest): Promise<Transaction> {
    const transformed = transformTransactionForAPI(data);
    const transaction = await apiClient.post<Transaction>('/transactions', transformed);
    return transformTransaction(transaction);
  },

  /**
   * Update an existing transaction
   */
  async updateTransaction(id: number, data: UpdateTransactionRequest): Promise<Transaction> {
    const transformed = transformTransactionForAPI(data);
    const transaction = await apiClient.put<Transaction>(`/transactions/${id}`, transformed);
    return transformTransaction(transaction);
  },

  /**
   * Delete a transaction
   */
  async deleteTransaction(id: number): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/transactions/${id}`);
  },
};

