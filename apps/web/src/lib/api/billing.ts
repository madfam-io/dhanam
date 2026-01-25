import { apiClient } from './client';

export interface UsageMetrics {
  date: string;
  tier: 'free' | 'premium';
  usage: {
    esg_calculation: { used: number; limit: number };
    monte_carlo_simulation: { used: number; limit: number };
    goal_probability: { used: number; limit: number };
    scenario_analysis: { used: number; limit: number };
    portfolio_rebalance: { used: number; limit: number };
    api_request: { used: number; limit: number };
  };
}

export interface BillingEvent {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

export interface SubscriptionStatus {
  tier: 'free' | 'premium';
  startedAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
}

export interface UpgradeResponse {
  checkoutUrl: string;
  provider: string;
}

export const billingApi = {
  /**
   * Get current usage metrics for the authenticated user
   */
  async getUsage(): Promise<UsageMetrics> {
    return apiClient.get<UsageMetrics>('/billing/usage');
  },

  /**
   * Get billing history for the authenticated user
   */
  async getHistory(limit = 20): Promise<BillingEvent[]> {
    return apiClient.get<BillingEvent[]>('/billing/history', { limit });
  },

  /**
   * Get subscription status for the authenticated user
   */
  async getStatus(): Promise<SubscriptionStatus> {
    return apiClient.get<SubscriptionStatus>('/billing/status');
  },

  /**
   * Initiate upgrade to premium subscription
   */
  async upgradeToPremium(options: {
    orgId?: string;
    plan?: string;
    successUrl?: string;
    cancelUrl?: string;
    countryCode?: string;
  }): Promise<UpgradeResponse> {
    return apiClient.post<UpgradeResponse>('/billing/upgrade', options);
  },

  /**
   * Create billing portal session for subscription management
   */
  async createPortalSession(): Promise<{ portalUrl: string }> {
    return apiClient.post<{ portalUrl: string }>('/billing/portal');
  },
};
