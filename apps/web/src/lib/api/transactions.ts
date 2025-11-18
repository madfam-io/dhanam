import { apiClient } from './client';
import { Transaction } from '@dhanam/shared';

export interface CreateTransactionDto {
  accountId: string;
  amount: number;
  date: Date;
  description: string;
  merchant?: string;
  categoryId?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateTransactionDto {
  amount?: number;
  date?: Date;
  description?: string;
  merchant?: string;
  categoryId?: string;
  metadata?: Record<string, unknown>;
}

export interface TransactionsFilterDto {
  accountId?: string;
  categoryId?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: 'amount' | 'date' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface TransactionsResponse {
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
}

export const transactionsApi = {
  getTransactions: async (
    spaceId: string,
    filter: TransactionsFilterDto
  ): Promise<TransactionsResponse> => {
    return apiClient.get<TransactionsResponse>(
      `/spaces/${spaceId}/transactions`,
      filter as Record<string, unknown>
    );
  },

  getTransaction: async (spaceId: string, transactionId: string): Promise<Transaction> => {
    return apiClient.get<Transaction>(`/spaces/${spaceId}/transactions/${transactionId}`);
  },

  createTransaction: async (spaceId: string, dto: CreateTransactionDto): Promise<Transaction> => {
    return apiClient.post<Transaction>(`/spaces/${spaceId}/transactions`, dto);
  },

  updateTransaction: async (
    spaceId: string,
    transactionId: string,
    dto: UpdateTransactionDto
  ): Promise<Transaction> => {
    return apiClient.patch<Transaction>(`/spaces/${spaceId}/transactions/${transactionId}`, dto);
  },

  deleteTransaction: async (spaceId: string, transactionId: string): Promise<void> => {
    await apiClient.delete(`/spaces/${spaceId}/transactions/${transactionId}`);
  },

  bulkCategorize: async (
    spaceId: string,
    transactionIds: string[],
    categoryId: string
  ): Promise<Transaction[]> => {
    return apiClient.post<Transaction[]>(`/spaces/${spaceId}/transactions/bulk-categorize`, {
      transactionIds,
      categoryId,
    });
  },
};
