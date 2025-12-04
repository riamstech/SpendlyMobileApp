import { apiClient } from '../client';

export interface Promotion {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  actionUrl: string | null;
  type: 'credit_card' | 'loan' | 'insurance' | 'other';
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  priority: number;
  targetCountry: string | null;
  targetState: string | null;
  createdAt: string;
  updatedAt: string;
}

export const promotionsService = {
  async getPromotions(): Promise<Promotion[]> {
    return apiClient.get<Promotion[]>('/promotions');
  },
};
