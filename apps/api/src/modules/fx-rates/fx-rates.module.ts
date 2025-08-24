import { Module } from '@nestjs/common';
import { FxRatesService } from './fx-rates.service';
import { FxRatesController } from './fx-rates.controller';
import { CoreModule } from '@core/core.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [CoreModule, HttpModule],
  providers: [FxRatesService],
  controllers: [FxRatesController],
  exports: [FxRatesService],
})
export class FxRatesModule {}