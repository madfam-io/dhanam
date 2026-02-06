import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { RedisService } from '../../../core/redis/redis.service';

import { ImmutableAdapter } from './immutable.adapter';

import { createRedisMock, createConfigMock, createLoggerMock } from '../../../../test/helpers/api-mock-factory';

describe('ImmutableAdapter', () => {
  let adapter: ImmutableAdapter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImmutableAdapter,
        { provide: ConfigService, useValue: createConfigMock() },
        { provide: RedisService, useValue: createRedisMock() },
      ],
    }).compile();

    adapter = module.get<ImmutableAdapter>(ImmutableAdapter);
    (adapter as any).logger = createLoggerMock();
  });

  it('should have correct platform metadata', () => {
    expect(adapter.platform).toBe('immutable');
    expect(adapter.chain).toBe('immutable-zkevm');
    expect(adapter.supportedTokens).toEqual(['IMX']);
  });

  describe('getPositions', () => {
    it('should return positions with correct structure', async () => {
      const result = await adapter.getPositions('space-1');

      expect(result.platform).toBe('immutable');
      expect(result.chain).toBe('immutable-zkevm');
      expect(result.totalValueUsd).toBe(2100);
      expect(result.tokens).toHaveLength(1);
      expect(result.staking).toHaveLength(1);
      expect(result.nfts).toHaveLength(2);
    });

    it('should include staking and marketplace earnings', async () => {
      const result = await adapter.getPositions('space-1');

      expect(result.earnings).toHaveLength(2);
      expect(result.earnings.map((e) => e.source)).toEqual(['staking', 'marketplace']);
    });

    it('should include Gods Unchained and Guild of Guardians NFTs', async () => {
      const result = await adapter.getPositions('space-1');

      expect(result.nfts[0].collection).toBe('Gods Unchained');
      expect(result.nfts[1].collection).toBe('Guild of Guardians');
    });
  });
});
