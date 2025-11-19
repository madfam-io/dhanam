'use client';

import { ReactNode } from 'react';
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
  // TODO: Get actual subscription status from auth context
  // For now, we'll check if the user has a premium subscription
  // const { user } = useAuth();
  // const isPremium = user?.subscriptionTier === 'premium';

  // Temporary: Always show upsell for demo
  const isPremium = false;

  if (!isPremium) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <PremiumUpsell feature={feature} context="feature_locked" />
    );
  }

  return <>{children}</>;
}
