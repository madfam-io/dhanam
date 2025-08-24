import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

import { EmailService } from './email.service';
import { EmailJobData } from './types';

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailService: EmailService) {}

  @Process('send-email')
  async handleSendEmail(job: Job<EmailJobData>) {
    this.logger.debug(`Processing email job ${job.id} for ${job.data.to}`);

    try {
      await this.emailService.sendEmailDirect(job.data);
      this.logger.log(`Email job ${job.id} completed successfully`);
    } catch (error) {
      this.logger.error(`Email job ${job.id} failed:`, error);
      throw error; // Let Bull handle retry logic
    }
  }
}
