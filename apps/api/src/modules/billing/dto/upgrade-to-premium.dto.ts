import { IsOptional, IsString } from 'class-validator';

export class UpgradeToPremiumDto {
  @IsOptional()
  @IsString()
  successUrl?: string;

  @IsOptional()
  @IsString()
  cancelUrl?: string;
}
