import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

import { DocumentCategory } from '@db';

export class RequestUploadUrlDto {
  @ApiProperty({ description: 'Original filename' })
  @IsString()
  @IsNotEmpty()
  filename: string;

  @ApiProperty({ description: 'MIME type of the file' })
  @IsString()
  @IsNotEmpty()
  contentType: string;

  @ApiPropertyOptional({ description: 'Document category', enum: DocumentCategory })
  @IsOptional()
  @IsEnum(DocumentCategory)
  category?: DocumentCategory;

  @ApiPropertyOptional({ description: 'Estimated file size in bytes (for quota pre-check)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500 * 1024 * 1024) // 500MB hard cap
  @Type(() => Number)
  estimatedSize?: number;

  @ApiPropertyOptional({ description: 'Optional manual asset ID to link to' })
  @IsOptional()
  @IsString()
  manualAssetId?: string;

  @ApiPropertyOptional({ description: 'Optional account ID to link to' })
  @IsOptional()
  @IsString()
  accountId?: string;
}
