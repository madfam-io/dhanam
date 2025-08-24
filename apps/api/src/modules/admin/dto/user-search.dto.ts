import { IsOptional, IsString, IsBoolean, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from './pagination.dto';

export enum UserSortBy {
  CREATED_AT = 'createdAt',
  LAST_LOGIN = 'lastLoginAt',
  NAME = 'name',
  EMAIL = 'email',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class UserSearchDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by email or name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Filter by email verified status' })
  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;

  @ApiPropertyOptional({ description: 'Filter by TOTP enabled status' })
  @IsOptional()
  @IsBoolean()
  totpEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Filter by onboarding completed status' })
  @IsOptional()
  @IsBoolean()
  onboardingCompleted?: boolean;

  @ApiPropertyOptional({ description: 'Filter by created after date' })
  @IsOptional()
  @IsDateString()
  createdAfter?: string;

  @ApiPropertyOptional({ description: 'Filter by created before date' })
  @IsOptional()
  @IsDateString()
  createdBefore?: string;

  @ApiPropertyOptional({ enum: UserSortBy, description: 'Sort by field' })
  @IsOptional()
  @IsEnum(UserSortBy)
  sortBy?: UserSortBy = UserSortBy.CREATED_AT;

  @ApiPropertyOptional({ enum: SortOrder, description: 'Sort order' })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}