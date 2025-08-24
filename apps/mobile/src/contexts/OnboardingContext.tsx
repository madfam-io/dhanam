import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { onboardingApi } from '../services/api';

export interface OnboardingStatus {
  completed: boolean;
  currentStep: string | null;
  completedAt: string | null;
  progress: number;
  stepStatus: Record<string, boolean>;
  remainingSteps: string[];
  optionalSteps: string[];
}

interface OnboardingContextType {
  status: OnboardingStatus | null;
  isLoading: boolean;
  error: string | null;
  updateStep: (step: string, data?: any) => Promise<void>;
  completeOnboarding: (skipOptional?: boolean) => Promise<void>;
  skipStep: (step: string) => Promise<void>;
  refreshStatus: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

interface OnboardingProviderProps {
  children: React.ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const { user } = useAuth();
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = async () => {
    if (!user) return;

    try {
      setError(null);
      setIsLoading(true);
      const response = await onboardingApi.getStatus();
      setStatus(response);
    } catch (err: any) {
      setError('Error al cargar el estado del onboarding');
      console.error('Error fetching onboarding status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStep = async (step: string, data?: any) => {
    try {
      setError(null);
      const response = await onboardingApi.updateStep(step, data);
      setStatus(response);
    } catch (err: any) {
      setError('Error al actualizar el paso del onboarding');
      throw err;
    }
  };

  const completeOnboarding = async (skipOptional = false) => {
    try {
      setError(null);
      const response = await onboardingApi.complete(skipOptional);
      setStatus(response);
    } catch (err: any) {
      setError('Error al completar el onboarding');
      throw err;
    }
  };

  const skipStep = async (step: string) => {
    try {
      setError(null);
      const response = await onboardingApi.skipStep(step);
      setStatus(response);
    } catch (err: any) {
      setError('Error al saltar el paso');
      throw err;
    }
  };

  useEffect(() => {
    if (user && !user.onboardingCompleted) {
      refreshStatus();
    } else if (user?.onboardingCompleted) {
      setIsLoading(false);
    }
  }, [user]);

  const value: OnboardingContextType = {
    status,
    isLoading,
    error,
    updateStep,
    completeOnboarding,
    skipStep,
    refreshStatus,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}