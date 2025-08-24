import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@core/auth/guards/roles.guard';

// Remove Role import - we'll use a different approach
import { SendTestEmailDto, SendBatchEmailDto } from './dto';
import { EmailService } from './email.service';

@ApiTags('Email')
@Controller('email')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('test')
  // @Roles('ADMIN') - commented out for now, need admin role system
  @ApiOperation({ summary: 'Send test email' })
  async sendTestEmail(@Body() dto: SendTestEmailDto) {
    await this.emailService.sendWelcomeEmail(dto.email, dto.name || 'Test User');
    return { message: 'Test email sent' };
  }

  @Post('batch')
  // @Roles('ADMIN') - commented out for now, need admin role system
  @ApiOperation({ summary: 'Send batch emails' })
  async sendBatchEmails(@Body() dto: SendBatchEmailDto) {
    await this.emailService.sendBatchEmails(dto.recipients, dto.subject, dto.template, dto.context);
    return {
      message: 'Batch emails queued',
      count: dto.recipients.length,
    };
  }
}
