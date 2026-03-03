import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import { PaginationDto } from './pagination.dto';

export class SpaceSearchDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by space name or owner email' })
  @IsOptional()
  @IsString()
  query?: string;
}
