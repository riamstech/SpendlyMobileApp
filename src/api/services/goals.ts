import { apiClient } from '../client';

export interface SavingsGoal {
  id: number;
  userId?: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt?: string;
  updatedAt?: string;
  // Support legacy snake_case for backward compatibility
  user_id?: number;
  target_amount?: number;
  current_amount?: number;
  target_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateGoalRequest {
  name: string;
  target_amount: number;
  target_date: string;
}

export interface UpdateGoalRequest {
  name?: string;
  target_amount?: number;
  current_amount?: number;
  target_date?: string;
  status?: 'active' | 'completed' | 'cancelled';
}

export const goalsApi = {
  // Get all goals for the current user
  getAll: () => apiClient.get<SavingsGoal[]>('/goals'),

  // Get a single goal by ID
  getById: (id: number) => apiClient.get<SavingsGoal>(`/goals/${id}`),

  // Create a new savings goal
  create: (data: CreateGoalRequest) => apiClient.post<SavingsGoal>('/goals', data),

  // Update a goal
  update: (id: number, data: UpdateGoalRequest) =>
    apiClient.put<SavingsGoal>(`/goals/${id}`, data),

  // Delete a goal
  delete: (id: number) => apiClient.delete(`/goals/${id}`),
};
