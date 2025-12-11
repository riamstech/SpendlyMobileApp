import { apiClient } from '../client';

export interface Receipt {
  id: number;
  // Support both camelCase (from API client) and snake_case
  user_id?: number;
  userId?: number;
  file_path?: string;
  filePath?: string;
  ocr_text?: string | null;
  ocrText?: string | null;
  amount: number | null;
  merchant: string | null;
  date: string | null;
  category_id?: number | null;
  categoryId?: number | null;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

export interface CreateReceiptRequest {
  file: File;
  amount?: number;
  merchant?: string;
  date?: string;
  category_id?: number;
}

export interface UpdateReceiptRequest {
  amount?: number;
  merchant?: string;
  date?: string;
  category_id?: number;
}

export const receiptsApi = {
  // Get all receipts for the current user
  getAll: () => apiClient.get<Receipt[]>('/receipts'),

  // Get a single receipt by ID
  getById: (id: number) => apiClient.get<Receipt>(`/receipts/${id}`),

  // Upload a new receipt
  create: (data: CreateReceiptRequest) => {
    const formData = new FormData();
    formData.append('file', data.file);
    if (data.amount !== undefined) formData.append('amount', String(data.amount));
    if (data.merchant) formData.append('merchant', data.merchant);
    if (data.date) formData.append('date', data.date);
    if (data.category_id) formData.append('category_id', String(data.category_id));

    return apiClient.post<Receipt>('/receipts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Update receipt details (not the file)
  update: (id: number, data: UpdateReceiptRequest) =>
    apiClient.put<Receipt>(`/receipts/${id}`, data),

  // Delete a receipt
  delete: (id: number) => apiClient.delete(`/receipts/${id}`),
};
