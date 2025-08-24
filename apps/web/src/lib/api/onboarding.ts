import { apiClient } from './client';

export interface OnboardingStatus {
  completed: boolean;
  currentStep: string | null;
  completedAt: string | null;
  progress: number;
  stepStatus: Record<string, boolean>;
  remainingSteps: string[];
  optionalSteps: string[];
}

export interface UpdatePreferencesData {
  locale?: string;
  timezone?: string;
  currency?: string;
  emailNotifications?: boolean;
  transactionAlerts?: boolean;
  budgetAlerts?: boolean;
  weeklyReports?: boolean;
  monthlyReports?: boolean;
}

export const onboardingApi = {
  // Get onboarding status
  getStatus: async (): Promise<OnboardingStatus> => {
    const response = await apiClient.get('/onboarding/status');
    return response.data;
  },

  // Update onboarding step
  updateStep: async (step: string, data?: any): Promise<OnboardingStatus> => {
    const response = await apiClient.put('/onboarding/step', { step, data });
    return response.data;
  },

  // Complete onboarding
  complete: async (skipOptional = false): Promise<OnboardingStatus> => {
    const response = await apiClient.post('/onboarding/complete', { 
      skipOptional,
      metadata: {
        source: 'web',
        timestamp: new Date().toISOString(),
      }
    });
    return response.data;
  },

  // Skip optional step
  skipStep: async (step: string): Promise<OnboardingStatus> => {
    const response = await apiClient.post(`/onboarding/skip/${step}`);
    return response.data;
  },

  // Update user preferences
  updatePreferences: async (preferences: UpdatePreferencesData): Promise<{ success: boolean }> => {
    const response = await apiClient.put('/onboarding/preferences', preferences);
    return response.data;
  },

  // Verify email
  verifyEmail: async (token: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post('/onboarding/verify-email', { token });
    return response.data;
  },

  // Resend email verification
  resendVerification: async (): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post('/onboarding/resend-verification');
    return response.data;
  },

  // Reset onboarding (for testing/support)
  reset: async (): Promise<OnboardingStatus> => {
    const response = await apiClient.post('/onboarding/reset');
    return response.data;
  },
};