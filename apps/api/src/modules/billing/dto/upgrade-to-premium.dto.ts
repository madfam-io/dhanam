import { IsOptional, IsString } from 'class-validator';

export class UpgradeToPremiumDto {
  @IsOptional()
  @IsString()
  successUrl?: string;

  @IsOptional()
  @IsString()
  cancelUrl?: string;

  /**
   * Janua organization ID (for external app integration, e.g., Enclii)
   * When provided, the subscription is linked to this organization
   */
  @IsOptional()
  @IsString()
  orgId?: string;

  /**
   * Plan ID (e.g., 'enclii_sovereign', 'dhanam_premium')
   * Used to select the appropriate product/price in the payment provider
   */
  @IsOptional()
  @IsString()
  plan?: string;

  /**
   * Country code for provider routing (e.g., 'MX', 'US')
   * Determines which payment provider to use (Conekta for MX, Polar for others)
   */
  @IsOptional()
  @IsString()
  countryCode?: string;
}
