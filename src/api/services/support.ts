import { apiClient } from '../client';

export interface TicketMessage {
  id: number;
  supportTicketId: number;
  userId: number;
  message: string;
  attachmentPath: string | null;
  createdAt: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface SupportTicketFeedback {
  id: number;
  supportTicketId: number;
  userId: number;
  rating: number;
  comment: string | null;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupportTicket {
  id: number;
  userId: number;
  subject: string;
  message: string;
  screenshotPath: string | null;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  messages?: TicketMessage[];
  feedback?: SupportTicketFeedback | null;
}

export interface CreateTicketRequest {
  subject: string;
  message: string;
  screenshot?: File;
}

export interface SubmitFeedbackRequest {
  rating: number;
  comment?: string;
}

export const supportApi = {
  // Get all tickets for the current user
  getAll: () => apiClient.get<SupportTicket[]>('/support-tickets'),

  // Get a single ticket by ID
  getById: (id: number) => apiClient.get<SupportTicket>(`/support-tickets/${id}`),

  // Create a new support ticket
  create: (data: CreateTicketRequest) => {
    const formData = new FormData();
    formData.append('subject', data.subject);
    formData.append('message', data.message);
    if (data.screenshot) {
      formData.append('screenshot', data.screenshot);
    }

    return apiClient.post<SupportTicket>('/support-tickets', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Reply to a ticket
  reply: (ticketId: number, message: string, attachment?: File) => {
    const formData = new FormData();
    formData.append('message', message);
    if (attachment) {
      formData.append('attachment', attachment);
    }
    return apiClient.post<TicketMessage>(`/support-tickets/${ticketId}/reply`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Delete a ticket (if allowed)
  delete: (id: number) => apiClient.delete(`/support-tickets/${id}`),

  // Submit feedback once ticket is resolved/closed
  submitFeedback: (ticketId: number, data: SubmitFeedbackRequest) =>
    apiClient.post(`/support-tickets/${ticketId}/feedback`, data),
};
