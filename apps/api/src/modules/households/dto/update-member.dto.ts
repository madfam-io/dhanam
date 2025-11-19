import { IsEnum, IsBoolean, IsOptional, IsDateString, IsString } from 'class-validator';
import { RelationshipType } from '@prisma/client';

export class UpdateMemberDto {
  @IsEnum(RelationshipType)
  @IsOptional()
  relationship?: RelationshipType;

  @IsBoolean()
  @IsOptional()
  isMinor?: boolean;

  @IsDateString()
  @IsOptional()
  accessStartDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
