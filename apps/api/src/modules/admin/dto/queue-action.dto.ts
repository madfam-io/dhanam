import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class QueueActionDto {
  @ApiProperty({ description: 'Name of the BullMQ queue to act on' })
  @IsString()
  @MinLength(1)
  queueName: string;
}
