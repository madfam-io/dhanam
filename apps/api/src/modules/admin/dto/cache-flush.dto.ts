import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, MinLength } from 'class-validator';

export class CacheFlushDto {
  @ApiProperty({ description: 'Redis key pattern to flush (e.g. "admin:*", "session:*")' })
  @IsString()
  @MinLength(1)
  pattern: string;

  @ApiProperty({ description: 'Confirmation flag to prevent accidental flushes' })
  @IsBoolean()
  confirm: boolean;
}
