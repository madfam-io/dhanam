import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class CompareAssetsDto {
  @ApiProperty({ description: 'Asset symbols to compare', example: ['BTC', 'ETH'] })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  symbols: string[];
}

export class CompareEnhancedAssetsDto {
  @ApiProperty({ description: 'Asset symbols to compare (v2)', example: ['BTC', 'ETH'] })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  symbols: string[];
}

export class RefreshEsgDataDto {
  @ApiProperty({ description: 'Asset symbols to refresh', example: ['BTC', 'ETH'] })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  symbols: string[];
}
