import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { RedisService } from '../../../core/redis/redis.service';

import { StarAtlasAdapter } from './star-atlas.adapter';

import { createRedisMock, createConfigMock, createLoggerMock } from '../../../../test/helpers/api-mock-factory';

describe('StarAtlasAdapter', () => {
  let adapter: StarAtlasAdapter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StarAtlasAdapter,
        { provide: ConfigService, useValue: createConfigMock() },
        { provide: RedisService, useValue: createRedisMock() },
      ],
    }).compile();

    adapter = module.get<StarAtlasAdapter>(StarAtlasAdapter);
    (adapter as any).logger = createLoggerMock();
  });

  it('should have correct platform metadata', () => {
    expect(adapter.platform).toBe('star-atlas');
    expect(adapter.chain).toBe('solana');
    expect(adapter.supportedTokens).toEqual(['ATLAS', 'POLIS']);
  });

  describe('getPositions', () => {
    it('should return positions with correct structure', async () => {
      const result = await adapter.getPositions('space-1');

      expect(result.platform).toBe('star-atlas');
      expect(result.chain).toBe('solana');
      expect(result.totalValueUsd).toBe(2800);
      expect(result.tokens).toHaveLength(2);
      expect(result.staking).toHaveLength(1);
      expect(result.nfts).toHaveLength(2);
    });

    it('should include ship NFTs', async () => {
      const result = await adapter.getPositions('space-1');

      expect(result.nfts[0].collection).toBe('Star Atlas Ships');
      expect(result.nfts[1].collection).toBe('Star Atlas Ships');
    });

    it('should include fleet staking and mission earnings', async () => {
      const result = await adapter.getPositions('space-1');

      expect(result.earnings).toHaveLength(2);
      expect(result.earnings.map((e) => e.source)).toEqual(['staking', 'p2e']);
    });
  });
});
