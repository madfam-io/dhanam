import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { RedisService } from '../../../core/redis/redis.service';

import { IlluviumAdapter } from './illuvium.adapter';

import { createRedisMock, createConfigMock, createLoggerMock } from '../../../../test/helpers/api-mock-factory';

describe('IlluviumAdapter', () => {
  let adapter: IlluviumAdapter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IlluviumAdapter,
        { provide: ConfigService, useValue: createConfigMock() },
        { provide: RedisService, useValue: createRedisMock() },
      ],
    }).compile();

    adapter = module.get<IlluviumAdapter>(IlluviumAdapter);
    (adapter as any).logger = createLoggerMock();
  });

  it('should have correct platform metadata', () => {
    expect(adapter.platform).toBe('illuvium');
    expect(adapter.chain).toBe('immutable-zkevm');
    expect(adapter.supportedTokens).toEqual(['ILV']);
  });

  describe('getPositions', () => {
    it('should return positions with correct structure', async () => {
      const result = await adapter.getPositions('space-1');

      expect(result.platform).toBe('illuvium');
      expect(result.chain).toBe('immutable-zkevm');
      expect(result.totalValueUsd).toBe(6200);
      expect(result.tokens).toHaveLength(1);
      expect(result.tokens[0].symbol).toBe('ILV');
      expect(result.staking).toHaveLength(1);
      expect(result.land).toHaveLength(1);
      expect(result.nfts).toHaveLength(1);
    });

    it('should include staking with sILV rewards', async () => {
      const result = await adapter.getPositions('space-1');

      expect(result.staking[0].rewardToken).toBe('sILV');
      expect(result.staking[0].apy).toBe(18);
    });

    it('should include p2e and staking earnings', async () => {
      const result = await adapter.getPositions('space-1');

      expect(result.earnings).toHaveLength(2);
      expect(result.earnings.map((e) => e.source)).toEqual(['staking', 'p2e']);
    });
  });
});
