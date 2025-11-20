import { IsUUID, IsBoolean, IsOptional, IsDateString } from 'class-validator';

export class ShareAccountDto {
  @IsUUID()
  sharedWithId: string;

  @IsOptional()
  @IsBoolean()
  canView?: boolean;

  @IsOptional()
  @IsBoolean()
  canEdit?: boolean;

  @IsOptional()
  @IsBoolean()
  canDelete?: boolean;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class UpdateSharingPermissionDto {
  @IsOptional()
  @IsBoolean()
  canView?: boolean;

  @IsOptional()
  @IsBoolean()
  canEdit?: boolean;

  @IsOptional()
  @IsBoolean()
  canDelete?: boolean;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
