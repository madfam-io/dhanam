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
    return apiClient.get<PaginatedResponse<UserDetails>>('/admin/users', params);
  },

  async getUserDetails(userId: string): Promise<UserDetails> {
    return apiClient.get<UserDetails>(`/admin/users/${userId}`);
  },

  async getSystemStats(): Promise<SystemStats> {
    return apiClient.get<SystemStats>('/admin/stats');
  },

  async searchAuditLogs(params: AuditLogSearchParams = {}): Promise<PaginatedResponse<AuditLog>> {
    return apiClient.get<PaginatedResponse<AuditLog>>('/admin/audit-logs', params);
  },

  async getOnboardingFunnel(): Promise<OnboardingFunnel> {
    return apiClient.get<OnboardingFunnel>('/admin/analytics/onboarding-funnel');
  },

  async getFeatureFlags(): Promise<FeatureFlag[]> {
    return apiClient.get<FeatureFlag[]>('/admin/feature-flags');
  },

  async getFeatureFlag(key: string): Promise<FeatureFlag> {
    return apiClient.get<FeatureFlag>(`/admin/feature-flags/${key}`);
  },

  async updateFeatureFlag(key: string, updates: Partial<FeatureFlag>): Promise<FeatureFlag> {
    return apiClient.post<FeatureFlag>(`/admin/feature-flags/${key}`, updates);
  },
};
