import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePlaidLinkDto {
  @ApiProperty({ description: 'Public token from Plaid Link' })
  @IsString()
  publicToken: string;

  @ApiProperty({ description: 'External ID for tracking', required: false })
  @IsString()
  @IsOptional()
  externalId?: string;

  @ApiProperty({ description: 'Selected account IDs', required: false })
  @IsArray()
  @IsOptional()
  accountIds?: string[];
}