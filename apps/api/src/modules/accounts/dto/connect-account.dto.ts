import { Provider } from '@dhanam/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsIn, IsOptional, IsObject } from 'class-validator';

export class ConnectAccountDto {
  @ApiProperty({ enum: ['belvo', 'plaid', 'bitso'] })
  @IsIn(['belvo', 'plaid', 'bitso'])
  provider: Exclude<Provider, 'manual'>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  linkToken?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  credentials?: Record<string, any>;
}
