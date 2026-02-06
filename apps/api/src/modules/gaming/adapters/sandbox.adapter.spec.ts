import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { RedisService } from '../../../core/redis/redis.service';

import { SandboxAdapter } from './sandbox.adapter';

import { createRedisMock, createConfigMock, createLoggerMock } from '../../../../test/helpers/api-mock-factory';

describe('SandboxAdapter', () => {
  let adapter: SandboxAdapter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SandboxAdapter,
        { provide: ConfigService, useValue: createConfigMock() },
        { provide: RedisService, useValue: createRedisMock() },
      ],
    }).compile();

    adapter = module.get<SandboxAdapter>(SandboxAdapter);
    (adapter as any).logger = createLoggerMock();
  });

  it('should have correct platform metadata', () => {
    expect(adapter.platform).toBe('sandbox');
    expect(adapter.chain).toBe('polygon');
    expect(adapter.supportedTokens).toEqual(['SAND']);
  });

  describe('getPositions', () => {
    it('should return positions with correct structure', async () => {
      const result = await adapter.getPositions('space-1');

      expect(result.platform).toBe('sandbox');
      expect(result.chain).toBe('polygon');
      expect(result.totalValueUsd).toBeGreaterThan(0);
      expect(result.tokens).toHaveLength(1);
      expect(result.tokens[0].symbol).toBe('SAND');
      expect(result.staking).toHaveLength(1);
      expect(result.land.length).toBeGreaterThan(0);
      expect(result.earnings.length).toBeGreaterThan(0);
    });

    it('should include staking, land, and earnings', async () => {
      const result = await adapter.getPositions('space-1');

      expect(result.staking[0].token).toBe('SAND');
      expect(result.staking[0].apy).toBe(8.5);
      expect(result.land).toHaveLength(3);
      expect(result.earnings).toHaveLength(3);
      expect(result.earnings.map((e) => e.source)).toEqual(['staking', 'rental', 'creator']);
    });
  });
});
