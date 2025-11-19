import { IsUUID, IsNotEmpty, IsEnum, IsBoolean, IsOptional, IsDateString, IsString } from 'class-validator';
import { RelationshipType } from '@prisma/client';

export class AddMemberDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsEnum(RelationshipType)
  @IsNotEmpty()
  relationship: RelationshipType;

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
