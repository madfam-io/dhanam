import { SetMetadata } from '@nestjs/common';
import { SubscriptionTier } from '@prisma/client';

export const TIER_KEY = 'subscription_tier';

/**
 * Decorator to require a specific subscription tier for an endpoint
 * @param tier The minimum subscription tier required
 * @example
 * @RequiresTier('premium')
 * @Get('advanced-analytics')
 * async getAdvancedAnalytics() { ... }
 */
export const RequiresTier = (tier: SubscriptionTier) => SetMetadata(TIER_KEY, tier);

/**
 * Convenience decorator for premium tier
 * @example
 * @RequiresPremium()
 * @Get('monte-carlo')
 * async getMonteCarloSimulation() { ... }
 */
export const RequiresPremium = () => RequiresTier('premium' as SubscriptionTier);
