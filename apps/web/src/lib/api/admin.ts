import { apiClient } from './client';

// Types
export interface SystemStats {
  users: {
    total: number;
    verified: number;
    withTotp: number;
    active30Days: number;
  };
  spaces: {
    total: number;
    personal: number;
    business: number;
  };
  accounts: {
    total: number;
    connected: number;
    byProvider: Record<string, number>;
  };
  transactions: {
    total: number;
    last30Days: number;
    categorized: number;
  };
}

export interface UserSearchParams {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'email' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export interface UserDetails {
  id: string;
  email: string;
  name: string;
  locale: string;
  timezone: string;
  totpEnabled: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  spaces: Array<{
    id: string;
    name: string;
    type: 'personal' | 'business';
    role: string;
    createdAt: string;
  }>;
  accountsCount: number;
  transactionsCount: number;
  lastActivity: string | null;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AuditLogSearchParams {
  userId?: string;
  action?: string;
  resource?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface OnboardingFunnel {
  total: number;
  steps: Array<{
    step: string;
    count: number;
    percentage: number;
  }>;
  completion: {
    rate: number;
    averageTimeMinutes: number;
  };
  dropoff: Array<{
    fromStep: string;
    toStep: string;
    count: number;
    percentage: number;
  }>;
}

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage?: number;
  targetedUsers?: string[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// API client
export const adminApi = {
  async searchUsers(params: UserSearchParams = {}): Promise<PaginatedResponse<UserDetails>> {
    const response = await apiClient.get('/admin/users', { params });
    return response.data;
  },

  async getUserDetails(userId: string): Promise<UserDetails> {
    const response = await apiClient.get(`/admin/users/${userId}`);
    return response.data;
  },

  async getSystemStats(): Promise<SystemStats> {
    const response = await apiClient.get('/admin/stats');
    return response.data;
  },

  async searchAuditLogs(params: AuditLogSearchParams = {}): Promise<PaginatedResponse<AuditLog>> {
    const response = await apiClient.get('/admin/audit-logs', { params });
    return response.data;
  },

  async getOnboardingFunnel(): Promise<OnboardingFunnel> {
    const response = await apiClient.get('/admin/analytics/onboarding-funnel');
    return response.data;
  },

  async getFeatureFlags(): Promise<FeatureFlag[]> {
    const response = await apiClient.get('/admin/feature-flags');
    return response.data;
  },

  async getFeatureFlag(key: string): Promise<FeatureFlag> {
    const response = await apiClient.get(`/admin/feature-flags/${key}`);
    return response.data;
  },

  async updateFeatureFlag(key: string, updates: Partial<FeatureFlag>): Promise<FeatureFlag> {
    const response = await apiClient.post(`/admin/feature-flags/${key}`, updates);
    return response.data;
  },
};