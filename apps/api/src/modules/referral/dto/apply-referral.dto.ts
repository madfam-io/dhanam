import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ApplyReferralDto {
  @ApiProperty({ description: 'The referral code to apply', example: 'MADFAM-A1B2C3D4' })
  @IsString()
  code: string;

  @ApiProperty({
    description: 'Target product the referred user is signing up for',
    example: 'dhanam',
  })
  @IsString()
  targetProduct: string;

  @ApiProperty({ description: 'UTM source parameter', required: false })
  @IsOptional()
  @IsString()
  utmSource?: string;

  @ApiProperty({ description: 'UTM medium parameter', required: false })
  @IsOptional()
  @IsString()
  utmMedium?: string;

  @ApiProperty({ description: 'UTM campaign parameter', required: false })
  @IsOptional()
  @IsString()
  utmCampaign?: string;
}
