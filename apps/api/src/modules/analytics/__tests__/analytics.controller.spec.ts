import { Test, TestingModule } from '@nestjs/testing';

// Mock Prisma client enums before importing anything that uses them
jest.mock('@prisma/client', () => ({
  ...jest.requireActual('@prisma/client'),
  Currency: {
    USD: 'USD',
    EUR: 'EUR',
    MXN: 'MXN',
    CAD: 'CAD',
  },
}));

import { AnalyticsController } from '../analytics.controller';
import { AnalyticsService } from '../analytics.service';
import { AnomalyService } from '../anomaly.service';
import { LongTermForecastService } from '../long-term-forecast.service';

// Define DTO types inline to avoid import issues with decorators
type CreateProjectionDto = {
  projectionYears: number;
  inflationRate?: number;
  currentAge: number;
  retirementAge: number;
  lifeExpectancy?: number;
  includeAccounts?: boolean;
  includeRecurring?: boolean;
};

type WhatIfComparisonDto = {
  baseConfig: CreateProjectionDto;
  scenarios: Array<{ name: string; description?: string }>;
};

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let analyticsService: jest.Mocked<AnalyticsService>;
  let anomalyService: jest.Mocked<AnomalyService>;
  let longTermForecastService: jest.Mocked<LongTermForecastService>;

  const mockReq = { user: { userId: 'user-123' } } as any;
  const spaceId = 'space-456';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: AnalyticsService,
          useValue: {
            getConsolidatedNetWorth: jest.fn(),
            getNetWorth: jest.fn(),
            getNetWorthHistory: jest.fn(),
            getNetWorthByOwnership: jest.fn(),
            getAccountsByOwnership: jest.fn(),
            getCashflowForecast: jest.fn(),
            getSpendingByCategory: jest.fn(),
            getIncomeVsExpenses: jest.fn(),
            getAccountBalances: jest.fn(),
            getPortfolioAllocation: jest.fn(),
            getDashboardData: jest.fn(),
            getStatistics: jest.fn(),
            getAnnualTrends: jest.fn(),
            getCalendarData: jest.fn(),
            executeQuery: jest.fn(),
          },
        },
        {
          provide: AnomalyService,
          useValue: {
            detectAnomalies: jest.fn(),
            getAnomalySummary: jest.fn(),
          },
        },
        {
          provide: LongTermForecastService,
          useValue: {
            generateProjection: jest.fn(),
            compareScenarios: jest.fn(),
            getQuickProjection: jest.fn(),
            getScenarioTemplates: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    analyticsService = module.get(AnalyticsService) as jest.Mocked<AnalyticsService>;
    anomalyService = module.get(AnomalyService) as jest.Mocked<AnomalyService>;
    longTermForecastService = module.get(
      LongTermForecastService
    ) as jest.Mocked<LongTermForecastService>;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ── AnalyticsService endpoints ──────────────────────────────────────

  describe('GET /analytics/consolidated-net-worth', () => {
    it('should call analyticsService.getConsolidatedNetWorth with userId and currency', async () => {
      const mockResult = { totalNetWorth: 100000 };
      analyticsService.getConsolidatedNetWorth.mockResolvedValue(mockResult as any);

      const result = await controller.getConsolidatedNetWorth(mockReq, 'USD');

      expect(analyticsService.getConsolidatedNetWorth).toHaveBeenCalledWith('user-123', 'USD');
      expect(result).toEqual(mockResult);
    });

    it('should pass undefined when no currency provided', async () => {
      const mockResult = { totalNetWorth: 50000 };
      analyticsService.getConsolidatedNetWorth.mockResolvedValue(mockResult as any);

      const result = await controller.getConsolidatedNetWorth(mockReq, undefined);

      expect(analyticsService.getConsolidatedNetWorth).toHaveBeenCalledWith('user-123', undefined);
      expect(result).toEqual(mockResult);
    });

    it('should uppercase the currency string', async () => {
      analyticsService.getConsolidatedNetWorth.mockResolvedValue({} as any);

      await controller.getConsolidatedNetWorth(mockReq, 'mxn');

      expect(analyticsService.getConsolidatedNetWorth).toHaveBeenCalledWith('user-123', 'MXN');
    });
  });

  describe('GET /analytics/:spaceId/net-worth', () => {
    it('should call analyticsService.getNetWorth with userId, spaceId, and currency', async () => {
      const mockResult = { totalAssets: 200000, totalLiabilities: 50000, netWorth: 150000 };
      analyticsService.getNetWorth.mockResolvedValue(mockResult as any);

      const result = await controller.getNetWorth(mockReq, spaceId, 'EUR');

      expect(analyticsService.getNetWorth).toHaveBeenCalledWith('user-123', spaceId, 'EUR');
      expect(result).toEqual(mockResult);
    });

    it('should pass undefined when no currency provided', async () => {
      analyticsService.getNetWorth.mockResolvedValue({} as any);

      await controller.getNetWorth(mockReq, spaceId, undefined);

      expect(analyticsService.getNetWorth).toHaveBeenCalledWith('user-123', spaceId, undefined);
    });
  });

  describe('GET /analytics/:spaceId/net-worth-history', () => {
    it('should call analyticsService.getNetWorthHistory with parsed days', async () => {
      const mockResult = [{ date: '2026-01-01', netWorth: 100000 }];
      analyticsService.getNetWorthHistory.mockResolvedValue(mockResult as any);

      const result = await controller.getNetWorthHistory(mockReq, spaceId, '90');

      expect(analyticsService.getNetWorthHistory).toHaveBeenCalledWith('user-123', spaceId, 90);
      expect(result).toEqual(mockResult);
    });

    it('should default to 30 days when days is not provided', async () => {
      analyticsService.getNetWorthHistory.mockResolvedValue([] as any);

      await controller.getNetWorthHistory(mockReq, spaceId, undefined);

      expect(analyticsService.getNetWorthHistory).toHaveBeenCalledWith('user-123', spaceId, 30);
    });
  });

  describe('GET /analytics/:spaceId/net-worth-by-ownership', () => {
    it('should call analyticsService.getNetWorthByOwnership with currency', async () => {
      const mockResult = { yours: 50000, mine: 40000, ours: 10000 };
      analyticsService.getNetWorthByOwnership.mockResolvedValue(mockResult as any);

      const result = await controller.getNetWorthByOwnership(mockReq, spaceId, 'MXN');

      expect(analyticsService.getNetWorthByOwnership).toHaveBeenCalledWith(
        'user-123',
        spaceId,
        'MXN'
      );
      expect(result).toEqual(mockResult);
    });

    it('should pass undefined when no currency provided', async () => {
      analyticsService.getNetWorthByOwnership.mockResolvedValue({} as any);

      await controller.getNetWorthByOwnership(mockReq, spaceId, undefined);

      expect(analyticsService.getNetWorthByOwnership).toHaveBeenCalledWith(
        'user-123',
        spaceId,
        undefined
      );
    });
  });

  describe('GET /analytics/:spaceId/accounts-by-ownership', () => {
    it('should call analyticsService.getAccountsByOwnership with filter', async () => {
      const mockResult = [{ id: 'acc-1', ownership: 'yours' }];
      analyticsService.getAccountsByOwnership.mockResolvedValue(mockResult as any);

      const result = await controller.getAccountsByOwnership(mockReq, spaceId, 'yours');

      expect(analyticsService.getAccountsByOwnership).toHaveBeenCalledWith(
        'user-123',
        spaceId,
        'yours'
      );
      expect(result).toEqual(mockResult);
    });

    it('should default to "all" when no ownership filter provided', async () => {
      analyticsService.getAccountsByOwnership.mockResolvedValue([] as any);

      await controller.getAccountsByOwnership(mockReq, spaceId, undefined);

      expect(analyticsService.getAccountsByOwnership).toHaveBeenCalledWith(
        'user-123',
        spaceId,
        'all'
      );
    });
  });

  describe('GET /analytics/:spaceId/cashflow-forecast', () => {
    it('should call analyticsService.getCashflowForecast with parsed days', async () => {
      const mockResult = { forecast: [] };
      analyticsService.getCashflowForecast.mockResolvedValue(mockResult as any);

      const result = await controller.getCashflowForecast(mockReq, spaceId, '90');

      expect(analyticsService.getCashflowForecast).toHaveBeenCalledWith('user-123', spaceId, 90);
      expect(result).toEqual(mockResult);
    });

    it('should default to 60 days when days is not provided', async () => {
      analyticsService.getCashflowForecast.mockResolvedValue({} as any);

      await controller.getCashflowForecast(mockReq, spaceId, undefined);

      expect(analyticsService.getCashflowForecast).toHaveBeenCalledWith('user-123', spaceId, 60);
    });
  });

  describe('GET /analytics/:spaceId/spending-by-category', () => {
    it('should call analyticsService.getSpendingByCategory with Date objects', async () => {
      const mockResult = [{ category: 'Food', amount: 500 }];
      analyticsService.getSpendingByCategory.mockResolvedValue(mockResult as any);

      const result = await controller.getSpendingByCategory(
        mockReq,
        spaceId,
        '2026-01-01',
        '2026-01-31'
      );

      expect(analyticsService.getSpendingByCategory).toHaveBeenCalledWith(
        'user-123',
        spaceId,
        new Date('2026-01-01'),
        new Date('2026-01-31')
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('GET /analytics/:spaceId/income-vs-expenses', () => {
    it('should call analyticsService.getIncomeVsExpenses with parsed months', async () => {
      const mockResult = [{ month: '2026-01', income: 5000, expenses: 3000 }];
      analyticsService.getIncomeVsExpenses.mockResolvedValue(mockResult as any);

      const result = await controller.getIncomeVsExpenses(mockReq, spaceId, '12');

      expect(analyticsService.getIncomeVsExpenses).toHaveBeenCalledWith('user-123', spaceId, 12);
      expect(result).toEqual(mockResult);
    });

    it('should default to 6 months when months is not provided', async () => {
      analyticsService.getIncomeVsExpenses.mockResolvedValue([] as any);

      await controller.getIncomeVsExpenses(mockReq, spaceId, undefined);

      expect(analyticsService.getIncomeVsExpenses).toHaveBeenCalledWith('user-123', spaceId, 6);
    });
  });

  describe('GET /analytics/:spaceId/account-balances', () => {
    it('should call analyticsService.getAccountBalances with userId and spaceId', async () => {
      const mockResult = [{ accountId: 'acc-1', balance: 10000 }];
      analyticsService.getAccountBalances.mockResolvedValue(mockResult as any);

      const result = await controller.getAccountBalances(mockReq, spaceId);

      expect(analyticsService.getAccountBalances).toHaveBeenCalledWith('user-123', spaceId);
      expect(result).toEqual(mockResult);
    });
  });

  describe('GET /analytics/:spaceId/portfolio-allocation', () => {
    it('should call analyticsService.getPortfolioAllocation with userId and spaceId', async () => {
      const mockResult = [{ category: 'Stocks', percentage: 60 }];
      analyticsService.getPortfolioAllocation.mockResolvedValue(mockResult as any);

      const result = await controller.getPortfolioAllocation(mockReq, spaceId);

      expect(analyticsService.getPortfolioAllocation).toHaveBeenCalledWith('user-123', spaceId);
      expect(result).toEqual(mockResult);
    });
  });

  describe('GET /analytics/:spaceId/dashboard-data', () => {
    it('should call analyticsService.getDashboardData with userId and spaceId', async () => {
      const mockResult = { netWorth: 100000, accounts: [] };
      analyticsService.getDashboardData.mockResolvedValue(mockResult as any);

      const result = await controller.getDashboardData(mockReq, spaceId);

      expect(analyticsService.getDashboardData).toHaveBeenCalledWith('user-123', spaceId);
      expect(result).toEqual(mockResult);
    });
  });

  describe('GET /analytics/:spaceId/statistics', () => {
    it('should call analyticsService.getStatistics with Date objects', async () => {
      const mockResult = { topPurchases: [], topMerchants: [], topCategories: [] };
      analyticsService.getStatistics.mockResolvedValue(mockResult as any);

      const result = await controller.getStatistics(mockReq, spaceId, '2026-01-01', '2026-03-31');

      expect(analyticsService.getStatistics).toHaveBeenCalledWith(
        'user-123',
        spaceId,
        new Date('2026-01-01'),
        new Date('2026-03-31')
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('GET /analytics/:spaceId/trends', () => {
    it('should call analyticsService.getAnnualTrends with parsed months', async () => {
      const mockResult = [{ month: '2026-01', savingsRate: 0.2 }];
      analyticsService.getAnnualTrends.mockResolvedValue(mockResult as any);

      const result = await controller.getAnnualTrends(mockReq, spaceId, '24');

      expect(analyticsService.getAnnualTrends).toHaveBeenCalledWith('user-123', spaceId, 24);
      expect(result).toEqual(mockResult);
    });

    it('should default to 12 months when months is not provided', async () => {
      analyticsService.getAnnualTrends.mockResolvedValue([] as any);

      await controller.getAnnualTrends(mockReq, spaceId, undefined);

      expect(analyticsService.getAnnualTrends).toHaveBeenCalledWith('user-123', spaceId, 12);
    });
  });

  describe('GET /analytics/:spaceId/calendar', () => {
    it('should call analyticsService.getCalendarData with parsed year and month', async () => {
      const mockResult = { days: {} };
      analyticsService.getCalendarData.mockResolvedValue(mockResult as any);

      const result = await controller.getCalendarData(mockReq, spaceId, '2026', '3');

      expect(analyticsService.getCalendarData).toHaveBeenCalledWith('user-123', spaceId, 2026, 3);
      expect(result).toEqual(mockResult);
    });
  });

  describe('POST /analytics/:spaceId/query', () => {
    it('should call analyticsService.executeQuery with Date-converted body', async () => {
      const mockResult = { rows: [], total: 0 };
      analyticsService.executeQuery.mockResolvedValue(mockResult as any);

      const body = {
        startDate: '2026-01-01',
        endDate: '2026-03-31',
        groupBy: 'category' as const,
        aggregation: 'sum' as const,
      };

      const result = await controller.executeQuery(mockReq, spaceId, body);

      expect(analyticsService.executeQuery).toHaveBeenCalledWith('user-123', spaceId, {
        ...body,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-03-31'),
      });
      expect(result).toEqual(mockResult);
    });

    it('should pass optional filter fields through to executeQuery', async () => {
      analyticsService.executeQuery.mockResolvedValue({} as any);

      const body = {
        startDate: '2026-02-01',
        endDate: '2026-02-28',
        groupBy: 'merchant' as const,
        categoryIds: ['cat-1', 'cat-2'],
        tagIds: ['tag-1'],
        merchantNames: ['Amazon'],
        accountIds: ['acc-1'],
        amountMin: 10,
        amountMax: 1000,
        aggregation: 'count' as const,
      };

      await controller.executeQuery(mockReq, spaceId, body);

      expect(analyticsService.executeQuery).toHaveBeenCalledWith('user-123', spaceId, {
        ...body,
        startDate: new Date('2026-02-01'),
        endDate: new Date('2026-02-28'),
      });
    });
  });

  // ── AnomalyService endpoints ────────────────────────────────────────

  describe('GET /analytics/:spaceId/anomalies', () => {
    it('should call anomalyService.detectAnomalies with parsed days and limit', async () => {
      const mockResult = [{ id: 'anomaly-1', type: 'unusual_amount' }];
      anomalyService.detectAnomalies.mockResolvedValue(mockResult as any);

      const result = await controller.getAnomalies(mockReq, spaceId, '14', '25');

      expect(anomalyService.detectAnomalies).toHaveBeenCalledWith('user-123', spaceId, {
        days: 14,
        limit: 25,
      });
      expect(result).toEqual(mockResult);
    });

    it('should default to 30 days and 50 limit when not provided', async () => {
      anomalyService.detectAnomalies.mockResolvedValue([] as any);

      await controller.getAnomalies(mockReq, spaceId, undefined, undefined);

      expect(anomalyService.detectAnomalies).toHaveBeenCalledWith('user-123', spaceId, {
        days: 30,
        limit: 50,
      });
    });
  });

  describe('GET /analytics/:spaceId/anomalies/summary', () => {
    it('should call anomalyService.getAnomalySummary with spaceId and userId', async () => {
      const mockResult = { totalAnomalies: 5, highSeverity: 1 };
      anomalyService.getAnomalySummary.mockResolvedValue(mockResult as any);

      const result = await controller.getAnomalySummary(mockReq, spaceId);

      expect(anomalyService.getAnomalySummary).toHaveBeenCalledWith(spaceId, 'user-123');
      expect(result).toEqual(mockResult);
    });
  });

  // ── LongTermForecastService endpoints ───────────────────────────────

  describe('POST /analytics/:spaceId/projections', () => {
    it('should call longTermForecastService.generateProjection with dto', async () => {
      const dto: CreateProjectionDto = {
        projectionYears: 20,
        currentAge: 30,
        retirementAge: 65,
        inflationRate: 0.03,
        includeAccounts: true,
        includeRecurring: true,
      };
      const mockResult = { projection: [], summary: {} };
      longTermForecastService.generateProjection.mockResolvedValue(mockResult as any);

      const result = await controller.generateProjection(mockReq, spaceId, dto as any);

      expect(longTermForecastService.generateProjection).toHaveBeenCalledWith(
        'user-123',
        spaceId,
        dto
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('POST /analytics/:spaceId/projections/compare', () => {
    it('should call longTermForecastService.compareScenarios with dto', async () => {
      const dto: WhatIfComparisonDto = {
        baseConfig: {
          projectionYears: 20,
          currentAge: 30,
          retirementAge: 65,
        },
        scenarios: [{ name: 'Early Retirement' }],
      };
      const mockResult = { baseline: {}, scenarios: [] };
      longTermForecastService.compareScenarios.mockResolvedValue(mockResult as any);

      const result = await controller.compareScenarios(mockReq, spaceId, dto as any);

      expect(longTermForecastService.compareScenarios).toHaveBeenCalledWith(
        'user-123',
        spaceId,
        dto
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('GET /analytics/:spaceId/projections/quick', () => {
    it('should call longTermForecastService.getQuickProjection with parsed ages', async () => {
      const mockResult = { projectedNetWorth: 500000 };
      longTermForecastService.getQuickProjection.mockResolvedValue(mockResult as any);

      const result = await controller.getQuickProjection(mockReq, spaceId, '30', '65');

      expect(longTermForecastService.getQuickProjection).toHaveBeenCalledWith(
        'user-123',
        spaceId,
        30,
        65
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('GET /analytics/:spaceId/projections/scenario-templates', () => {
    it('should call longTermForecastService.getScenarioTemplates', () => {
      const mockResult = [{ name: 'Early Retirement' }, { name: 'Aggressive Savings' }];
      longTermForecastService.getScenarioTemplates.mockReturnValue(mockResult as any);

      const result = controller.getScenarioTemplates();

      expect(longTermForecastService.getScenarioTemplates).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });
});
