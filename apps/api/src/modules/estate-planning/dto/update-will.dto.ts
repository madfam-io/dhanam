import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateWillDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsBoolean()
  @IsOptional()
  legalDisclaimer?: boolean;
}
