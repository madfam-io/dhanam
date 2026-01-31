import { SetMetadata } from '@nestjs/common';

import { SubscriptionTier } from '@db';

export const TIER_KEY = 'subscription_tier';

/**
 * Decorator to require a specific subscription tier for an endpoint
 * @param tier The minimum subscription tier required
 * @example
 * @RequiresTier('pro')
 * @Get('advanced-analytics')
 * async getAdvancedAnalytics() { ... }
 */
export const RequiresTier = (tier: SubscriptionTier) => SetMetadata(TIER_KEY, tier);

/**
 * Convenience decorator for essentials tier
 * @example
 * @RequiresEssentials()
 * @Get('cashflow-forecast')
 * async getCashflowForecast() { ... }
 */
export const RequiresEssentials = () => RequiresTier('essentials' as SubscriptionTier);

/**
 * Convenience decorator for pro tier
 * @example
 * @RequiresPro()
 * @Get('monte-carlo')
 * async getMonteCarloSimulation() { ... }
 */
export const RequiresPro = () => RequiresTier('pro' as SubscriptionTier);

/**
 * @deprecated Use RequiresPro() instead. Kept for backward compatibility.
 */
export const RequiresPremium = () => RequiresTier('pro' as SubscriptionTier);
