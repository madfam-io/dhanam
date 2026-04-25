/**
 * =============================================================================
 * RFC 0011 — FX as a platform service (Phase 1: Dhanam-side service skeleton)
 * =============================================================================
 *
 * Mounted at `/v1/fx/*`. Coexists with the legacy `/v1/fx-rates/*` module —
 * the legacy module is the in-process Banxico consumer used by analytics; this
 * new module is the *platform service contract* for ecosystem consumers
 * (forgesight, karafiel, cotiza, tulana, rondelio, forj — see RFC 0011 §
 * "Migration sequencing").
 *
 * The legacy module deletion lands once forgesight has migrated and soaked
 * for one quarter (RFC 0011 §"Implementation plan", Week 4–8).
 * =============================================================================
 */
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CoreModule } from '@core/core.module';

import { RedisFxCacheService } from './cache/redis-fx-cache.service';
import { FxController } from './fx.controller';
import { FX_PROVIDER_CHAIN, FxService } from './fx.service';
import { BanxicoSieProvider } from './providers/banxico-sie.provider';
import { ExchangerateHostProvider } from './providers/exchangerate-host.provider';
import { FakeRateProvider } from './providers/fake-rate.provider';
import { OpenExchangeRatesProvider } from './providers/openexchangerates.provider';

@Module({
  imports: [
    ConfigModule,
    CoreModule,
    HttpModule.register({
      timeout: 8000,
      maxRedirects: 2,
    }),
  ],
  controllers: [FxController],
  providers: [
    FxService,
    RedisFxCacheService,
    OpenExchangeRatesProvider,
    ExchangerateHostProvider,
    BanxicoSieProvider,
    FakeRateProvider,
    {
      // RFC 0011 §"FX provider chain (failover)" — order matters.
      provide: FX_PROVIDER_CHAIN,
      useFactory: (
        oer: OpenExchangeRatesProvider,
        host: ExchangerateHostProvider,
        banxico: BanxicoSieProvider,
        fake: FakeRateProvider
      ) => [oer, host, banxico, fake],
      inject: [
        OpenExchangeRatesProvider,
        ExchangerateHostProvider,
        BanxicoSieProvider,
        FakeRateProvider,
      ],
    },
  ],
  exports: [FxService],
})
export class FxModule {}
