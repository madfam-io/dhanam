import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { RedisService } from '../../../core/redis/redis.service';

import { AxieAdapter } from './axie.adapter';

import { createRedisMock, createConfigMock, createLoggerMock } from '../../../../test/helpers/api-mock-factory';

describe('AxieAdapter', () => {
  let adapter: AxieAdapter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AxieAdapter,
        { provide: ConfigService, useValue: createConfigMock() },
        { provide: RedisService, useValue: createRedisMock() },
      ],
    }).compile();

    adapter = module.get<AxieAdapter>(AxieAdapter);
    (adapter as any).logger = createLoggerMock();
  });

  it('should have correct platform metadata', () => {
    expect(adapter.platform).toBe('axie');
    expect(adapter.chain).toBe('ronin');
    expect(adapter.supportedTokens).toEqual(['AXS', 'SLP', 'RONIN']);
  });

  describe('getPositions', () => {
    it('should return positions with correct structure', async () => {
      const result = await adapter.getPositions('space-1');

      expect(result.platform).toBe('axie');
      expect(result.chain).toBe('ronin');
      expect(result.totalValueUsd).toBeGreaterThan(0);
      expect(result.tokens).toHaveLength(2);
      expect(result.nfts).toHaveLength(3);
      expect(result.earnings).toHaveLength(3);
    });

    it('should include guild information', async () => {
      const result = await adapter.getPositions('space-1');

      expect(result.guild).toBeDefined();
      expect(result.guild!.guildName).toBe('Ronin Raiders');
      expect(result.guild!.role).toBe('manager');
      expect(result.guild!.scholarCount).toBe(5);
    });

    it('should include scholarship earnings', async () => {
      const result = await adapter.getPositions('space-1');

      const scholarship = result.earnings.find((e) => e.source === 'scholarship');
      expect(scholarship).toBeDefined();
      expect(scholarship!.monthlyAmountUsd).toBe(200);
    });
  });
});
