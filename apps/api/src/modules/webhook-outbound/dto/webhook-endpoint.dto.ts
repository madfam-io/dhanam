import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString, IsUrl } from 'class-validator';

export class RegisterEndpointDto {
  @ApiProperty({ example: 'forj', description: 'Consumer app id; one Svix application per id' })
  @IsString()
  consumerAppId!: string;

  @ApiProperty({ example: 'https://api.forj.design/api/billing/webhook' })
  @IsUrl({ require_tld: false })
  url!: string;

  @ApiProperty({
    example: ['subscription.created', 'payment.succeeded', 'merchant.onboarded'],
    description: 'Empty array = subscribe to all events',
  })
  @IsArray()
  @IsString({ each: true })
  subscribedEvents!: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateEndpointDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subscribedEvents?: string[];
}
