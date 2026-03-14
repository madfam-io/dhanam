import { Module } from '@nestjs/common';

import { AuditModule } from '@core/audit/audit.module';
import { PrismaModule } from '@core/prisma/prisma.module';

import { AdminModule } from '../admin/admin.module';
import { BillingModule } from '../billing/billing.module';
import { SpacesModule } from '../spaces/spaces.module';

import { CsvPreviewService } from './csv-preview.service';
import { DocumentsAdminController } from './documents-admin.controller';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  imports: [PrismaModule, SpacesModule, AuditModule, AdminModule, BillingModule],
  controllers: [DocumentsController, DocumentsAdminController],
  providers: [DocumentsService, CsvPreviewService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
