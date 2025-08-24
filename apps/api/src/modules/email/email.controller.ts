import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@core/auth/guards/roles.guard';
import { Roles } from '@core/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { EmailService } from './email.service';
import { SendTestEmailDto, SendBatchEmailDto } from './dto';

@ApiTags('Email')
@Controller('email')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('test')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Send test email' })
  async sendTestEmail(@Body() dto: SendTestEmailDto) {
    await this.emailService.sendWelcomeEmail(dto.email, dto.name || 'Test User');
    return { message: 'Test email sent' };
  }

  @Post('batch')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Send batch emails' })
  async sendBatchEmails(@Body() dto: SendBatchEmailDto) {
    await this.emailService.sendBatchEmails(
      dto.recipients,
      dto.subject,
      dto.template,
      dto.context,
    );
    return { 
      message: 'Batch emails queued',
      count: dto.recipients.length,
    };
  }
}