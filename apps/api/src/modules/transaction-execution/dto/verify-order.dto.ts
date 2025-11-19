import { IsString, Length } from 'class-validator';

export class VerifyOrderDto {
  @IsString()
  @Length(6, 6)
  otpCode: string;
}
