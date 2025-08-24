import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class AddWalletDto {
  @ApiProperty({
    description: 'Blockchain address',
    example: '0x742d35Cc6634C0532925a3b844Bc9e7595f40bD7',
  })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({
    description: 'Cryptocurrency type',
    enum: ['eth', 'btc'],
    example: 'eth',
  })
  @IsString()
  @IsIn(['eth', 'btc'])
  currency: string;

  @ApiProperty({
    description: 'Custom name for the wallet',
    example: 'My Cold Storage',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Optional label for organization',
    example: 'DeFi Wallet',
    required: false,
  })
  @IsString()
  @IsOptional()
  label?: string;
}
