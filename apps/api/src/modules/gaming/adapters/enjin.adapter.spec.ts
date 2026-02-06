import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { RedisService } from '../../../core/redis/redis.service';

import { EnjinAdapter } from './enjin.adapter';

import { createRedisMock, createConfigMock, createLoggerMock } from '../../../../test/helpers/api-mock-factory';

describe('EnjinAdapter', () => {
  let adapter: EnjinAdapter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnjinAdapter,
        { provide: ConfigService, useValue: createConfigMock() },
        { provide: RedisService, useValue: createRedisMock() },
      ],
    }).compile();

    adapter = module.get<EnjinAdapter>(EnjinAdapter);
    (adapter as any).logger = createLoggerMock();
  });

  it('should have correct platform metadata', () => {
    expect(adapter.platform).toBe('enjin');
    expect(adapter.chain).toBe('ethereum');
    expect(adapter.supportedTokens).toEqual(['ENJ']);
  });

  describe('getPositions', () => {
    it('should return positions with correct structure', async () => {
      const result = await adapter.getPositions('space-1');

      expect(result.platform).toBe('enjin');
      expect(result.chain).toBe('ethereum');
      expect(result.totalValueUsd).toBe(1850);
      expect(result.tokens).toHaveLength(1);
      expect(result.nfts).toHaveLength(2);
      expect(result.staking).toHaveLength(0);
    });

    it('should include marketplace earnings', async () => {
      const result = await adapter.getPositions('space-1');

      expect(result.earnings).toHaveLength(1);
      expect(result.earnings[0].source).toBe('marketplace');
    });

    it('should include meltValue on NFTs', async () => {
      const result = await adapter.getPositions('space-1');

      expect(result.nfts[0]).toHaveProperty('meltValue');
      expect(result.nfts[1]).toHaveProperty('meltValue');
    });
  });
});
