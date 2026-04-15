import { IsUUID } from 'class-validator';

export class CancelConfirmDto {
  @IsUUID()
  intentId: string;
}
