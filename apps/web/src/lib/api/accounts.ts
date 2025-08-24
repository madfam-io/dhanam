import { apiClient } from './client';
import { Account, Provider, AccountType, Currency } from '@dhanam/shared';

export interface ConnectAccountDto {
  provider: Exclude<Provider, 'manual'>;
  linkToken?: string;
  credentials?: Record<string, any>;
}

export interface CreateAccountDto {
  name: string;
  type: AccountType;
  subtype?: string;
  currency: Currency;
  balance: number;
}

export interface UpdateAccountDto {
  name?: string;
  balance?: number;
}

export const accountsApi = {
  getAccounts: async (spaceId: string): Promise<Account[]> => {
    const response = await apiClient.get(`/spaces/${spaceId}/accounts`);
    return response.data;
  },

  getAccount: async (spaceId: string, accountId: string): Promise<Account> => {
    const response = await apiClient.get(`/spaces/${spaceId}/accounts/${accountId}`);
    return response.data;
  },

  connectAccount: async (spaceId: string, dto: ConnectAccountDto): Promise<Account[]> => {
    const response = await apiClient.post(`/spaces/${spaceId}/accounts/connect`, dto);
    return response.data;
  },

  createAccount: async (spaceId: string, dto: CreateAccountDto): Promise<Account> => {
    const response = await apiClient.post(`/spaces/${spaceId}/accounts`, dto);
    return response.data;
  },

  updateAccount: async (
    spaceId: string,
    accountId: string,
    dto: UpdateAccountDto,
  ): Promise<Account> => {
    const response = await apiClient.patch(`/spaces/${spaceId}/accounts/${accountId}`, dto);
    return response.data;
  },

  deleteAccount: async (spaceId: string, accountId: string): Promise<void> => {
    await apiClient.delete(`/spaces/${spaceId}/accounts/${accountId}`);
  },

  refreshAccount: async (spaceId: string, accountId: string): Promise<Account> => {
    const response = await apiClient.post(`/spaces/${spaceId}/accounts/${accountId}/refresh`);
    return response.data;
  },
};