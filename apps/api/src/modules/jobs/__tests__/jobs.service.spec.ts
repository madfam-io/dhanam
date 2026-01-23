import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../../core/prisma/prisma.service';
import { RulesService } from '../../categories/rules.service';
import { BitsoService } from '../../providers/bitso/bitso.service';
import { BlockchainService } from '../../providers/blockchain/blockchain.service';
import { JobsService } from '../jobs.service';

describe('JobsService', () => {
  let service: JobsService;
  let prisma: jest.Mocked<PrismaService>;
  let rulesService: jest.Mocked<RulesService>;
  let bitsoService: jest.Mocked<BitsoService>;
  let blockchainService: jest.Mocked<BlockchainService>;

  const mockSpace = {
    id: 'space-123',
    name: 'Personal Space',
    type: 'personal',
    currency: 'MXN',
    accounts: [
      { id: 'account-1', type: 'checking', balance: { toNumber: () => 5000 }, currency: 'MXN' },
      { id: 'account-2', type: 'savings', balance: { toNumber: () => 10000 }, currency: 'MXN' },
      { id: 'account-3', type: 'credit', balance: { toNumber: () => -2000 }, currency: 'MXN' },
    ],
  };

  const mockConnection = {
    userId: 'user-123',
    provider: 'bitso',
  };

  const mockAccountWithMetadata = {
    id: 'account-blockchain',
    provider: 'manual',
    metadata: { readOnly: true },
    space: {
      userSpaces: [{ userId: 'user-456' }],
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        {
          provide: PrismaService,
          useValue: {
            space: {
              findMany: jest.fn(),
            },
            providerConnection: {
              findMany: jest.fn(),
              count: jest.fn(),
            },
            account: {
              findMany: jest.fn(),
            },
            assetValuation: {
              create: jest.fn(),
            },
          },
        },
        {
          provide: RulesService,
          useValue: {
            batchCategorizeTransactions: jest.fn(),
          },
        },
        {
          provide: BitsoService,
          useValue: {
            syncPortfolio: jest.fn(),
          },
        },
        {
          provide: BlockchainService,
          useValue: {
            syncWallets: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    rulesService = module.get(RulesService) as jest.Mocked<RulesService>;
    bitsoService = module.get(BitsoService) as jest.Mocked<BitsoService>;
    blockchainService = module.get(BlockchainService) as jest.Mocked<BlockchainService>;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('categorizeNewTransactions', () => {
    it('should categorize transactions for all spaces', async () => {
      const spaces = [{ id: 'space-1' }, { id: 'space-2' }];
      prisma.space.findMany.mockResolvedValue(spaces as any);
      rulesService.batchCategorizeTransactions
        .mockResolvedValueOnce({ categorized: 5, total: 10 })
        .mockResolvedValueOnce({ categorized: 3, total: 7 });

      await service.categorizeNewTransactions();

      expect(prisma.space.findMany).toHaveBeenCalledWith({ select: { id: true } });
      expect(rulesService.batchCategorizeTransactions).toHaveBeenCalledTimes(2);
      expect(rulesService.batchCategorizeTransactions).toHaveBeenCalledWith('space-1');
      expect(rulesService.batchCategorizeTransactions).toHaveBeenCalledWith('space-2');
    });

    it('should handle errors gracefully', async () => {
      prisma.space.findMany.mockRejectedValue(new Error('Database error'));

      // Should not throw, just log error
      await expect(service.categorizeNewTransactions()).resolves.not.toThrow();
    });

    it('should handle empty spaces list', async () => {
      prisma.space.findMany.mockResolvedValue([]);

      await service.categorizeNewTransactions();

      expect(rulesService.batchCategorizeTransactions).not.toHaveBeenCalled();
    });
  });

  describe('syncCryptoPortfolios', () => {
    it('should sync portfolios for all Bitso users', async () => {
      const connections = [{ userId: 'user-1' }, { userId: 'user-2' }];
      prisma.providerConnection.findMany.mockResolvedValue(connections as any);
      bitsoService.syncPortfolio.mockResolvedValue(undefined);

      await service.syncCryptoPortfolios();

      expect(prisma.providerConnection.findMany).toHaveBeenCalledWith({
        where: { provider: 'bitso' },
        select: { userId: true },
        distinct: ['userId'],
      });
      expect(bitsoService.syncPortfolio).toHaveBeenCalledTimes(2);
      expect(bitsoService.syncPortfolio).toHaveBeenCalledWith('user-1');
      expect(bitsoService.syncPortfolio).toHaveBeenCalledWith('user-2');
    });

    it('should continue syncing even if one user fails', async () => {
      const connections = [{ userId: 'user-1' }, { userId: 'user-2' }];
      prisma.providerConnection.findMany.mockResolvedValue(connections as any);
      bitsoService.syncPortfolio
        .mockRejectedValueOnce(new Error('Sync failed'))
        .mockResolvedValueOnce(undefined);

      await service.syncCryptoPortfolios();

      expect(bitsoService.syncPortfolio).toHaveBeenCalledTimes(2);
    });

    it('should handle database errors gracefully', async () => {
      prisma.providerConnection.findMany.mockRejectedValue(new Error('Database error'));

      await expect(service.syncCryptoPortfolios()).resolves.not.toThrow();
    });
  });

  describe('syncBlockchainWallets', () => {
    it('should sync blockchain wallets for users with read-only accounts', async () => {
      const accounts = [
        mockAccountWithMetadata,
        { ...mockAccountWithMetadata, id: 'account-2', space: { userSpaces: [{ userId: 'user-789' }] } },
      ];
      prisma.account.findMany.mockResolvedValue(accounts as any);
      blockchainService.syncWallets.mockResolvedValue(undefined);

      await service.syncBlockchainWallets();

      expect(prisma.account.findMany).toHaveBeenCalledWith({
        where: {
          provider: 'manual',
          metadata: { path: ['readOnly'], equals: true },
        },
        include: {
          space: { include: { userSpaces: { select: { userId: true }, take: 1 } } },
        },
        distinct: ['spaceId'],
      });
      // Should sync for unique users only
      expect(blockchainService.syncWallets).toHaveBeenCalledWith('user-456');
      expect(blockchainService.syncWallets).toHaveBeenCalledWith('user-789');
    });

    it('should continue syncing even if one user fails', async () => {
      const accounts = [
        mockAccountWithMetadata,
        { ...mockAccountWithMetadata, id: 'account-2', space: { userSpaces: [{ userId: 'user-789' }] } },
      ];
      prisma.account.findMany.mockResolvedValue(accounts as any);
      blockchainService.syncWallets
        .mockRejectedValueOnce(new Error('Sync failed'))
        .mockResolvedValueOnce(undefined);

      await service.syncBlockchainWallets();

      expect(blockchainService.syncWallets).toHaveBeenCalledTimes(2);
    });

    it('should handle accounts without userSpaces', async () => {
      const accounts = [{ ...mockAccountWithMetadata, space: { userSpaces: [] } }];
      prisma.account.findMany.mockResolvedValue(accounts as any);

      await service.syncBlockchainWallets();

      expect(blockchainService.syncWallets).not.toHaveBeenCalled();
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should log session cleanup metrics', async () => {
      prisma.providerConnection.count
        .mockResolvedValueOnce(100) // active connections
        .mockResolvedValueOnce(15); // stale connections

      await service.cleanupExpiredSessions();

      expect(prisma.providerConnection.count).toHaveBeenCalledTimes(2);
      expect(prisma.providerConnection.count).toHaveBeenLastCalledWith({
        where: { updatedAt: { lt: expect.any(Date) } },
      });
    });

    it('should handle errors gracefully', async () => {
      prisma.providerConnection.count.mockRejectedValue(new Error('Database error'));

      await expect(service.cleanupExpiredSessions()).resolves.not.toThrow();
    });
  });

  describe('generateValuationSnapshots', () => {
    it('should create valuation snapshots for all spaces', async () => {
      prisma.space.findMany.mockResolvedValue([mockSpace] as any);
      prisma.assetValuation.create.mockResolvedValue({} as any);

      await service.generateValuationSnapshots();

      expect(prisma.space.findMany).toHaveBeenCalledWith({ include: { accounts: true } });
      // Should create a snapshot for each account
      expect(prisma.assetValuation.create).toHaveBeenCalledTimes(3);
    });

    it('should handle spaces with no accounts', async () => {
      const emptySpace = { ...mockSpace, accounts: [] };
      prisma.space.findMany.mockResolvedValue([emptySpace] as any);

      await service.generateValuationSnapshots();

      expect(prisma.assetValuation.create).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      prisma.space.findMany.mockRejectedValue(new Error('Database error'));

      await expect(service.generateValuationSnapshots()).resolves.not.toThrow();
    });
  });

  describe('triggerCategorization', () => {
    it('should trigger categorization for a specific space', async () => {
      rulesService.batchCategorizeTransactions.mockResolvedValue({ categorized: 5, total: 10 });

      const result = await service.triggerCategorization('space-123');

      expect(result).toEqual({ categorized: 5, total: 10, spaces: 1 });
      expect(rulesService.batchCategorizeTransactions).toHaveBeenCalledWith('space-123');
    });

    it('should trigger categorization for all spaces when no spaceId provided', async () => {
      const spaces = [{ id: 'space-1' }, { id: 'space-2' }];
      prisma.space.findMany.mockResolvedValue(spaces as any);
      rulesService.batchCategorizeTransactions
        .mockResolvedValueOnce({ categorized: 3, total: 5 })
        .mockResolvedValueOnce({ categorized: 2, total: 5 });

      const result = await service.triggerCategorization();

      expect(result).toEqual({ categorized: 5, total: 10, spaces: 2 });
    });
  });

  describe('triggerPortfolioSync', () => {
    it('should trigger portfolio sync for a specific user', async () => {
      prisma.providerConnection.findMany.mockResolvedValue([{ userId: 'user-123' }] as any);
      bitsoService.syncPortfolio.mockResolvedValue(undefined);

      const result = await service.triggerPortfolioSync('user-123');

      expect(result).toEqual({ syncedUsers: 1, errors: 0 });
      expect(prisma.providerConnection.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123', provider: 'bitso' },
        select: { userId: true },
        distinct: ['userId'],
      });
    });

    it('should trigger portfolio sync for all users when no userId provided', async () => {
      const connections = [{ userId: 'user-1' }, { userId: 'user-2' }];
      prisma.providerConnection.findMany.mockResolvedValue(connections as any);
      bitsoService.syncPortfolio.mockResolvedValue(undefined);

      const result = await service.triggerPortfolioSync();

      expect(result).toEqual({ syncedUsers: 2, errors: 0 });
      expect(prisma.providerConnection.findMany).toHaveBeenCalledWith({
        where: { provider: 'bitso' },
        select: { userId: true },
        distinct: ['userId'],
      });
    });

    it('should track errors during portfolio sync', async () => {
      const connections = [{ userId: 'user-1' }, { userId: 'user-2' }];
      prisma.providerConnection.findMany.mockResolvedValue(connections as any);
      bitsoService.syncPortfolio
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Sync failed'));

      const result = await service.triggerPortfolioSync();

      expect(result).toEqual({ syncedUsers: 1, errors: 1 });
    });
  });
});
