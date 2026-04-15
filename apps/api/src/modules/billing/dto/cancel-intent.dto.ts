import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum CancelReasonEnum {
  TOO_EXPENSIVE = 'too_expensive',
  MISSING_FEATURES = 'missing_features',
  SWITCHED_SERVICE = 'switched_service',
  UNUSED = 'unused',
  TECHNICAL_ISSUES = 'technical_issues',
  OTHER = 'other',
}

export class CancelIntentDto {
  @IsEnum(CancelReasonEnum)
  reason: CancelReasonEnum;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reasonText?: string;
}
