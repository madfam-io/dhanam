import { SetMetadata } from '@nestjs/common';

export const FEATURE_KEY = 'required_feature';

export type GateableFeature =
  | 'lifeBeat'
  | 'householdViews'
  | 'collectiblesValuation'
  | 'mlCategorization';

/**
 * Decorator to require a specific feature flag to be enabled for the user's tier
 * @param feature The feature that must be enabled
 * @example
 * @RequiresFeature('lifeBeat')
 * @Get('wills')
 * async getWills() { ... }
 */
export const RequiresFeature = (feature: GateableFeature) => SetMetadata(FEATURE_KEY, feature);
