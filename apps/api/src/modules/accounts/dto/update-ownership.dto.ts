import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { AccountOwnership } from '@prisma/client';

export class UpdateOwnershipDto {
  @IsEnum(AccountOwnership)
  ownership: AccountOwnership;

  @IsOptional()
  @IsUUID()
  ownerId?: string; // Required for 'individual', null for 'joint' or 'trust'
}
