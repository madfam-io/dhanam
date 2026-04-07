import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';

export class StartVerificationDto {
  @ApiProperty({
    description: 'URL to redirect the user after MetaMap verification flow completes',
    example: 'https://app.dhan.am/kyc/callback',
  })
  @IsString()
  @IsUrl({ require_tld: false })
  redirectUrl: string;

  @ApiPropertyOptional({
    description: 'ISO 3166-1 alpha-2 country code for the user (defaults to MX)',
    example: 'MX',
  })
  @IsOptional()
  @IsString()
  countryCode?: string;
}
