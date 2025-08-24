import { Test, TestingModule } from '@nestjs/testing';
import { EnhancedEsgService } from './enhanced-esg.service';
import { PrismaService } from '@core/prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

describe('EnhancedEsgService', () => {
  let service: EnhancedEsgService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnhancedEsgService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>(),
        },
      ],
    }).compile();

    service = module.get<EnhancedEsgService>(EnhancedEsgService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAssetESG', () => {
    it('should return ESG data for Bitcoin', async () => {
      const result = await service.getAssetESG('BTC');
      
      expect(result).toBeDefined();
      expect(result?.symbol).toBe('BTC');
      expect(result?.score.environmental).toBeDefined();
      expect(result?.score.social).toBeDefined();
      expect(result?.score.governance).toBeDefined();
      expect(result?.score.overall).toBeDefined();
    });

    it('should return cached data on subsequent calls', async () => {
      const firstCall = await service.getAssetESG('ETH');
      const secondCall = await service.getAssetESG('ETH');
      
      expect(firstCall).toEqual(secondCall);
    });

    it('should return null for unknown symbols', async () => {
      const result = await service.getAssetESG('UNKNOWN');
      expect(result).toBeNull();
    });
  });

  describe('getPortfolioESGAnalysis', () => {
    it('should calculate portfolio ESG for user with crypto holdings', async () => {
      const mockAccounts = [
        {
          id: 'account1',
          balance: 1000,
          metadata: { cryptoCurrency: 'BTC' },
        },
        {
          id: 'account2', 
          balance: 500,
          metadata: { cryptoCurrency: 'ETH' },
        },
      ];

      prisma.account.findMany.mockResolvedValue(mockAccounts as any);

      const result = await service.getPortfolioESGAnalysis('user1');
      
      expect(result).toBeDefined();
      expect(result.weightedScore.overall).toBeDefined();
      expect(result.assetBreakdown).toHaveLength(2);
      expect(result.performance.totalValue).toBe(1500);
    });

    it('should handle empty portfolio', async () => {
      prisma.account.findMany.mockResolvedValue([]);

      const result = await service.getPortfolioESGAnalysis('user1');
      
      expect(result.assetBreakdown).toHaveLength(0);
      expect(result.performance.totalValue).toBe(0);
    });
  });

  describe('compareAssets', () => {
    it('should compare multiple crypto assets', async () => {
      const symbols = ['BTC', 'ETH', 'ADA'];
      const result = await service.compareAssets(symbols);
      
      expect(result).toBeDefined();
      expect(result.comparison).toHaveLength(3);
      expect(result.bestPerformer).toBeDefined();
      expect(result.summary).toContain('Best overall performer');
    });

    it('should handle single asset comparison', async () => {
      const result = await service.compareAssets(['BTC']);
      
      expect(result.comparison).toHaveLength(1);
      expect(result.comparison?.[0]?.symbol).toBe('BTC');
    });
  });

  describe('refreshESGData', () => {
    it('should refresh ESG data for given symbols', async () => {
      const symbols = ['BTC', 'ETH'];
      
      await expect(service.refreshESGData(symbols)).resolves.not.toThrow();
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', async () => {
      const stats = await service.getCacheStats();
      
      expect(stats).toBeDefined();
      expect(typeof stats.size).toBe('number');
      expect(typeof stats.hitRate).toBe('number');
    });
  });
});