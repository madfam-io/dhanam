import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsArray, IsEnum } from 'class-validator';

import { EmailTemplate } from '../types';

export class SendTestEmailDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  name?: string;
}

export class SendBatchEmailDto {
  @ApiProperty({
    example: ['user1@example.com', 'user2@example.com'],
    description: 'List of recipient email addresses',
  })
  @IsArray()
  @IsEmail({}, { each: true })
  recipients: string[];

  @ApiProperty({ example: 'Monthly Newsletter' })
  @IsString()
  subject: string;

  @ApiProperty({
    enum: ['welcome', 'weekly-summary', 'monthly-report'],
    example: 'monthly-report',
  })
  @IsEnum(['welcome', 'weekly-summary', 'monthly-report'])
  template: EmailTemplate;

  @ApiProperty({
    example: { month: 'January', year: 2024 },
    description: 'Template context variables',
  })
  context: Record<string, any>;
}
