import { apiClient } from './client';
import { Transaction } from '@dhanam/shared';

export interface CreateTransactionDto {
  accountId: string;
  amount: number;
  date: Date;
  description: string;
  merchant?: string;
  categoryId?: string;
  metadata?: Record<string, any>;
}

export interface UpdateTransactionDto {
  amount?: number;
  date?: Date;
  description?: string;
  merchant?: string;
  categoryId?: string;
  metadata?: Record<string, any>;
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
    filter: TransactionsFilterDto,
  ): Promise<TransactionsResponse> => {
    const response = await apiClient.get(`/spaces/${spaceId}/transactions`, {
      params: filter,
    });
    return response.data;
  },

  getTransaction: async (
    spaceId: string,
    transactionId: string,
  ): Promise<Transaction> => {
    const response = await apiClient.get(
      `/spaces/${spaceId}/transactions/${transactionId}`,
    );
    return response.data;
  },

  createTransaction: async (
    spaceId: string,
    dto: CreateTransactionDto,
  ): Promise<Transaction> => {
    const response = await apiClient.post(`/spaces/${spaceId}/transactions`, dto);
    return response.data;
  },

  updateTransaction: async (
    spaceId: string,
    transactionId: string,
    dto: UpdateTransactionDto,
  ): Promise<Transaction> => {
    const response = await apiClient.patch(
      `/spaces/${spaceId}/transactions/${transactionId}`,
      dto,
    );
    return response.data;
  },

  deleteTransaction: async (
    spaceId: string,
    transactionId: string,
  ): Promise<void> => {
    await apiClient.delete(`/spaces/${spaceId}/transactions/${transactionId}`);
  },

  bulkCategorize: async (
    spaceId: string,
    transactionIds: string[],
    categoryId: string,
  ): Promise<Transaction[]> => {
    const response = await apiClient.post(
      `/spaces/${spaceId}/transactions/bulk-categorize`,
      {
        transactionIds,
        categoryId,
      },
    );
    return response.data;
  },
};