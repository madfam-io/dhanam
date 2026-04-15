import { isValidPlanId } from '../plan-id.validator';

describe('isValidPlanId', () => {
  // --- Bare tier names ---
  it.each(['essentials', 'pro', 'premium', 'madfam', 'sovereign'])(
    'accepts bare tier: %s',
    (plan) => {
      expect(isValidPlanId(plan)).toBe(true);
    }
  );

  // --- Product-prefixed plans (existing products) ---
  it.each([
    'enclii_essentials',
    'enclii_pro',
    'enclii_madfam',
    'tezca_pro',
    'yantra4d_essentials',
    'dhanam_pro',
    'karafiel_essentials',
    'karafiel_pro',
    'karafiel_premium',
    'forgesight_madfam',
  ])('accepts product-prefixed plan: %s', (plan) => {
    expect(isValidPlanId(plan)).toBe(true);
  });

  // --- Zero-touch: new products accepted without code changes ---
  it.each(['newservice_pro', 'mynewapp_essentials', 'customproduct_premium', 'abc123_madfam'])(
    'accepts unknown product (zero-touch): %s',
    (plan) => {
      expect(isValidPlanId(plan)).toBe(true);
    }
  );

  // --- With billing period suffix ---
  it.each([
    'karafiel_pro_yearly',
    'tezca_essentials_monthly',
    'pro_yearly',
    'enclii_madfam_annual',
    'newservice_pro_yearly',
  ])('accepts plan with billing period: %s', (plan) => {
    expect(isValidPlanId(plan)).toBe(true);
  });

  // --- Legacy plans ---
  it.each([
    'sovereign',
    'ecosystem',
    'enterprise',
    'scale',
    'enclii_sovereign',
    'enclii_ecosystem',
  ])('accepts legacy plan: %s', (plan) => {
    expect(isValidPlanId(plan)).toBe(true);
  });

  // --- Case insensitive ---
  it.each(['PRO', 'Karafiel_Pro', 'ENCLII_ESSENTIALS'])('accepts case-insensitive: %s', (plan) => {
    expect(isValidPlanId(plan)).toBe(true);
  });

  // --- Invalid inputs ---
  it.each(['', null, undefined, 123, 'xyzzy', '_pro', 'pro_', '123_pro', '123service_essentials'])(
    'rejects invalid input: %s',
    (plan) => {
      expect(isValidPlanId(plan as any)).toBe(false);
    }
  );

  // --- Backwards compatibility: all 37 original VALID_PLANS ---
  const ORIGINAL_PLANS = [
    'essentials',
    'pro',
    'madfam',
    'essentials_yearly',
    'pro_yearly',
    'madfam_yearly',
    'enclii_essentials',
    'enclii_pro',
    'enclii_madfam',
    'tezca_essentials',
    'tezca_pro',
    'tezca_madfam',
    'yantra4d_essentials',
    'yantra4d_pro',
    'yantra4d_madfam',
    'dhanam_essentials',
    'dhanam_pro',
    'dhanam_madfam',
    'karafiel_essentials',
    'karafiel_pro',
    'karafiel_premium',
    'karafiel_essentials_yearly',
    'karafiel_pro_yearly',
    'karafiel_premium_yearly',
    'forgesight_essentials',
    'forgesight_pro',
    'forgesight_madfam',
    'sovereign',
    'enclii_sovereign',
    'enclii_ecosystem',
  ];

  it.each(ORIGINAL_PLANS)('backwards compat — accepts original plan: %s', (plan) => {
    expect(isValidPlanId(plan)).toBe(true);
  });
});
