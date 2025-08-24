import { Module } from '@nestjs/common';
import { PreferencesService } from './preferences.service';
import { PreferencesController } from './preferences.controller';
import { CoreModule } from '@core/core.module';
import { AuditModule } from '@core/audit/audit.module';

@Module({
  imports: [CoreModule, AuditModule],
  providers: [PreferencesService],
  controllers: [PreferencesController],
  exports: [PreferencesService],
})
export class PreferencesModule {}