import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsIn, IsBoolean, Matches } from 'class-validator';

export class ImportWalletDto {
  @ApiProperty({
    description: 'Extended public key (xPub, yPub, or zPub)',
    example:
      'xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPfgyP3hooxujYzAu3fDVmz',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[xyz]pub[1-9A-HJ-NP-Za-km-z]{107,108}$/, {
    message: 'Invalid extended public key format',
  })
  xpub: string;

  @ApiProperty({
    description: 'Cryptocurrency type',
    enum: ['btc'],
    example: 'btc',
  })
  @IsString()
  @IsIn(['btc'])
  currency: string;

  @ApiProperty({
    description: 'Derivation path',
    example: "m/44'/0'/0'",
    default: "m/44'/0'/0'",
  })
  @IsString()
  @IsOptional()
  derivationPath: string = "m/44'/0'/0'";

  @ApiProperty({
    description: 'Include addresses with zero balance',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  includeEmpty?: boolean = false;
}
