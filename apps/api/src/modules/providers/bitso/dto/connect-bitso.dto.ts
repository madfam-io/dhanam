import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConnectBitsoDto {
  @ApiProperty({ description: 'Bitso API Key' })
  @IsString()
  apiKey: string;

  @ApiProperty({ description: 'Bitso API Secret' })
  @IsString()
  apiSecret: string;

  @ApiProperty({ description: 'External ID for tracking', required: false })
  @IsString()
  @IsOptional()
  externalId?: string;

  @ApiProperty({ description: 'Enable automatic portfolio sync', required: false })
  @IsOptional()
  autoSync?: boolean;
}