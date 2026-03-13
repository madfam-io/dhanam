import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ResolvedPrice {
  priceId: string;
  couponId?: string;
}

/**
 * Maps (tier, region, isPromo) -> Stripe Price ID and optional coupon.
 *
 * Strategy: Use a single Price ID per tier and apply regional discounts via
 * coupons. This avoids creating 24+ Price objects in Stripe.
 *
 * Mexico promo: Uses a specific coupon that adjusts to MXN$31/32/33 for 3 months.
 * Regional discounts: Uses percentage-based coupons per region.
 */
@Injectable()
export class PriceResolverService {
  private readonly logger = new Logger(PriceResolverService.name);

  constructor(private config: ConfigService) {}

  /**
   * Resolve the Stripe price ID and optional coupon for a given tier and region.
   */
  resolve(tier: string, region: number, isPromo: boolean): ResolvedPrice {
    const priceId = this.getPriceIdForTier(tier);

    if (!priceId) {
      throw new Error(`No Stripe price configured for tier: ${tier}`);
    }

    // Mexico promo override
    if (isPromo && region === 3) {
      const promoCoupon = this.config.get<string>('STRIPE_PROMO_COUPON_MX');
      if (promoCoupon) {
        return { priceId, couponId: promoCoupon };
      }
    }

    // Regional discount coupon
    const regionalCoupon = this.getRegionalCoupon(region);
    if (regionalCoupon) {
      return { priceId, couponId: regionalCoupon };
    }

    return { priceId };
  }

  private getPriceIdForTier(tier: string): string | undefined {
    switch (tier) {
      case 'essentials':
      case 'essentials_yearly':
        return this.config.get<string>('STRIPE_ESSENTIALS_PRICE_ID');
      case 'pro':
      case 'pro_yearly':
        return this.config.get<string>('STRIPE_PREMIUM_PRICE_ID');
      case 'premium':
      case 'premium_yearly':
        return this.config.get<string>('STRIPE_PREMIUM_PLAN_PRICE_ID');
      default:
        // Try product-prefixed plans (e.g., enclii_pro)
        if (tier.includes('_pro')) {
          return this.config.get<string>('STRIPE_PREMIUM_PRICE_ID');
        }
        if (tier.includes('_essentials')) {
          return this.config.get<string>('STRIPE_ESSENTIALS_PRICE_ID');
        }
        if (tier.includes('_premium')) {
          return this.config.get<string>('STRIPE_PREMIUM_PLAN_PRICE_ID');
        }
        return this.config.get<string>('STRIPE_PREMIUM_PRICE_ID');
    }
  }

  private getRegionalCoupon(region: number): string | undefined {
    switch (region) {
      case 2:
        return this.config.get<string>('STRIPE_REGIONAL_COUPON_T2');
      case 3:
        return this.config.get<string>('STRIPE_REGIONAL_COUPON_LATAM');
      case 4:
        return this.config.get<string>('STRIPE_REGIONAL_COUPON_EMERGING');
      default:
        return undefined; // Tier 1 - no discount
    }
  }
}
