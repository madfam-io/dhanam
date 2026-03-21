import { Logger, Module } from '@nestjs/common';

import { CryptoService } from './crypto.service';

const logger = new Logger('CryptoModule');

@Module({
  providers: [
    {
      provide: CryptoService,
      useFactory: () => {
        const provider = process.env.KMS_PROVIDER || 'local';
        if (provider !== 'local') {
          logger.warn(`KMS_PROVIDER=${provider} not yet implemented, falling back to local`);
        }
        return new CryptoService();
      },
    },
  ],
  exports: [CryptoService],
})
export class CryptoModule {}
