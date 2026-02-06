import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { RedisService } from '../../../core/redis/redis.service';

import { GalaAdapter } from './gala.adapter';

import { createRedisMock, createConfigMock, createLoggerMock } from '../../../../test/helpers/api-mock-factory';

describe('GalaAdapter', () => {
  let adapter: GalaAdapter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GalaAdapter,
        { provide: ConfigService, useValue: createConfigMock() },
        { provide: RedisService, useValue: createRedisMock() },
      ],
    }).compile();

    adapter = module.get<GalaAdapter>(GalaAdapter);
    (adapter as any).logger = createLoggerMock();
  });

  it('should have correct platform metadata', () => {
    expect(adapter.platform).toBe('gala');
    expect(adapter.chain).toBe('galachain');
    expect(adapter.supportedTokens).toEqual(['GALA']);
  });

  describe('getPositions', () => {
    it('should return positions with correct structure', async () => {
      const result = await adapter.getPositions('space-1');

      expect(result.platform).toBe('gala');
      expect(result.chain).toBe('galachain');
      expect(result.totalValueUsd).toBe(3400);
      expect(result.tokens).toHaveLength(1);
      expect(result.land).toHaveLength(1);
      expect(result.nfts).toHaveLength(1);
    });

    it('should include node rewards and p2e earnings', async () => {
      const result = await adapter.getPositions('space-1');

      expect(result.earnings).toHaveLength(2);
      expect(result.earnings.map((e) => e.source)).toEqual(['node_rewards', 'p2e']);
    });

    it('should include Gala Node NFT', async () => {
      const result = await adapter.getPositions('space-1');

      expect(result.nfts[0].name).toBe('Gala Node License');
      expect(result.nfts[0].collection).toBe('Gala Nodes');
    });
  });
});
