import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateBelvoLinkDto {
  @ApiProperty({ description: 'Institution ID from Belvo' })
  @IsString()
  institution: string;

  @ApiProperty({ description: 'Username for the financial institution' })
  @IsString()
  username: string;

  @ApiProperty({ description: 'Password for the financial institution' })
  @IsString()
  password: string;

  @ApiPropertyOptional({ description: 'Additional credentials if required' })
  @IsOptional()
  @IsObject()
  externalId?: Record<string, any>;
}
