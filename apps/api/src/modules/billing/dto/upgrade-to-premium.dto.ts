import { IsOptional, IsString, Matches } from 'class-validator';

export class UpgradeToPremiumDto {
  @IsOptional()
  @IsString()
  successUrl?: string;

  @IsOptional()
  @IsString()
  cancelUrl?: string;

  /**
   * Janua organization ID (for external app integration)
   * When provided, the subscription is linked to this organization
   */
  @IsOptional()
  @IsString()
  orgId?: string;

  /**
   * Plan ID (e.g., 'enclii_pro', 'tezca_pro', 'karafiel_essentials')
   * Used to select the appropriate product/price in the payment provider
   */
  @IsOptional()
  @IsString()
  plan?: string;

  /**
   * Product being upgraded (lowercase alphanumeric, e.g. 'karafiel').
   * Defaults to 'dhanam'.
   */
  @IsOptional()
  @Matches(/^[a-z][a-z0-9]*$/, { message: 'product must be lowercase alphanumeric' })
  product?: string;

  /**
   * Country code for provider routing (e.g., 'MX', 'US')
   * Determines which payment provider to use (Conekta for MX, Polar for others)
   */
  @IsOptional()
  @IsString()
  countryCode?: string;
}
