'use client';

import { ReactNode } from 'react';
import { useAuth } from '~/lib/hooks/use-auth';
import { PremiumUpsell } from './PremiumUpsell';

interface PremiumGateProps {
  children: ReactNode;
  feature?: string;
  fallback?: ReactNode;
}

/**
 * PremiumGate Component
 *
 * Conditionally renders children based on user's subscription status.
 * Shows upsell component if user is not premium.
 *
 * Usage:
 * <PremiumGate feature="Monte Carlo Simulations">
 *   <SimulationComponent />
 * </PremiumGate>
 */
export function PremiumGate({ children, feature, fallback }: PremiumGateProps) {
  const { user } = useAuth();
  const isPremium = user?.subscriptionTier === 'pro';

  if (!isPremium) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <PremiumUpsell feature={feature} context="feature_locked" />
    );
  }

  return <>{children}</>;
}
