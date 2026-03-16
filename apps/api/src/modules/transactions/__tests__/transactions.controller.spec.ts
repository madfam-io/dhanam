import { Test, TestingModule } from '@nestjs/testing';

import { TransactionsController } from '../transactions.controller';
import { TransactionsService } from '../transactions.service';

// Define DTO types inline to avoid import issues with decorators
type CreateTransactionDto = {
  accountId: string;
  amount: number;
  date: Date;
  description: string;
  merchant?: string;
  categoryId?: string;
  tagIds?: string[];
  reviewed?: boolean;
};

type UpdateTransactionDto = {
  amount?: number;
  date?: Date;
  description?: string;
  merchant?: string;
  categoryId?: string;
  tagIds?: string[];
  reviewed?: boolean;
};

type TransactionsFilterDto = {
  accountId?: string;
  categoryId?: string;
  tagIds?: string[];
  reviewed?: boolean;
  search?: string;
  page?: number;
  limit?: number;
};

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let transactionsService: jest.Mocked<TransactionsService>;

  const mockReq = { user: { id: 'user-123' } } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        {
          provide: TransactionsService,
          useValue: {
            findAll: jest.fn(),
            getUnreviewedCount: jest.fn(),
            getMerchants: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            bulkCategorize: jest.fn(),
            bulkReview: jest.fn(),
            renameMerchant: jest.fn(),
            mergeMerchants: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
    transactionsService = module.get(TransactionsService) as jest.Mocked<TransactionsService>;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /spaces/:spaceId/transactions', () => {
    it('should call findAll with spaceId, userId, and filter', async () => {
      const filter: TransactionsFilterDto = {
        accountId: 'acct-1',
        page: 1,
        limit: 20,
      };
      const mockResult = { data: [], total: 0, page: 1, limit: 20 };

      transactionsService.findAll.mockResolvedValue(mockResult as any);

      const result = await controller.findAll('space-123', filter as any, mockReq);

      expect(transactionsService.findAll).toHaveBeenCalledWith('space-123', 'user-123', filter);
      expect(result).toEqual(mockResult);
    });
  });

  describe('GET /spaces/:spaceId/transactions/unreviewed-count', () => {
    it('should call getUnreviewedCount with spaceId and userId', async () => {
      const mockResult = { count: 5 };

      transactionsService.getUnreviewedCount.mockResolvedValue(mockResult as any);

      const result = await controller.getUnreviewedCount('space-123', mockReq);

      expect(transactionsService.getUnreviewedCount).toHaveBeenCalledWith('space-123', 'user-123');
      expect(result).toEqual(mockResult);
    });
  });

  describe('GET /spaces/:spaceId/transactions/merchants', () => {
    it('should call getMerchants with spaceId and userId', async () => {
      const mockResult = [
        { merchant: 'Starbucks', count: 10 },
        { merchant: 'Amazon', count: 7 },
      ];

      transactionsService.getMerchants.mockResolvedValue(mockResult as any);

      const result = await controller.getMerchants('space-123', mockReq);

      expect(transactionsService.getMerchants).toHaveBeenCalledWith('space-123', 'user-123');
      expect(result).toEqual(mockResult);
    });
  });

  describe('GET /spaces/:spaceId/transactions/:id', () => {
    it('should call findOne with spaceId, userId, and id', async () => {
      const mockTransaction = {
        id: 'txn-1',
        amount: 42.5,
        description: 'Coffee',
      };

      transactionsService.findOne.mockResolvedValue(mockTransaction as any);

      const result = await controller.findOne('space-123', 'txn-1', mockReq);

      expect(transactionsService.findOne).toHaveBeenCalledWith('space-123', 'user-123', 'txn-1');
      expect(result).toEqual(mockTransaction);
    });
  });

  describe('POST /spaces/:spaceId/transactions', () => {
    it('should call create with spaceId, userId, and dto', async () => {
      const createDto: CreateTransactionDto = {
        accountId: 'acct-1',
        amount: 99.99,
        date: new Date('2026-03-01'),
        description: 'Groceries',
        merchant: 'Walmart',
        categoryId: 'cat-1',
        tagIds: ['tag-1'],
        reviewed: false,
      };
      const mockCreated = { id: 'txn-new', ...createDto };

      transactionsService.create.mockResolvedValue(mockCreated as any);

      const result = await controller.create('space-123', createDto as any, mockReq);

      expect(transactionsService.create).toHaveBeenCalledWith('space-123', 'user-123', createDto);
      expect(result).toEqual(mockCreated);
    });
  });

  describe('PATCH /spaces/:spaceId/transactions/:id', () => {
    it('should call update with spaceId, userId, id, and dto', async () => {
      const updateDto: UpdateTransactionDto = {
        amount: 55.0,
        description: 'Updated description',
      };
      const mockUpdated = { id: 'txn-1', ...updateDto };

      transactionsService.update.mockResolvedValue(mockUpdated as any);

      const result = await controller.update('space-123', 'txn-1', updateDto as any, mockReq);

      expect(transactionsService.update).toHaveBeenCalledWith(
        'space-123',
        'user-123',
        'txn-1',
        updateDto
      );
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('DELETE /spaces/:spaceId/transactions/:id', () => {
    it('should call remove with spaceId, userId, and id', async () => {
      transactionsService.remove.mockResolvedValue(undefined as any);

      await controller.remove('space-123', 'txn-1', mockReq);

      expect(transactionsService.remove).toHaveBeenCalledWith('space-123', 'user-123', 'txn-1');
    });
  });

  describe('POST /spaces/:spaceId/transactions/bulk-categorize', () => {
    it('should call bulkCategorize with spaceId, userId, transactionIds, and categoryId', async () => {
      const body = {
        transactionIds: ['txn-1', 'txn-2', 'txn-3'],
        categoryId: 'cat-1',
      };
      const mockResult = { count: 3 };

      transactionsService.bulkCategorize.mockResolvedValue(mockResult as any);

      const result = await controller.bulkCategorize('space-123', body, mockReq);

      expect(transactionsService.bulkCategorize).toHaveBeenCalledWith(
        'space-123',
        'user-123',
        body.transactionIds,
        body.categoryId
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('POST /spaces/:spaceId/transactions/bulk-review', () => {
    it('should call bulkReview with spaceId, userId, transactionIds, and reviewed', async () => {
      const body = {
        transactionIds: ['txn-1', 'txn-2'],
        reviewed: true,
      };
      const mockResult = { count: 2 };

      transactionsService.bulkReview.mockResolvedValue(mockResult as any);

      const result = await controller.bulkReview('space-123', body, mockReq);

      expect(transactionsService.bulkReview).toHaveBeenCalledWith(
        'space-123',
        'user-123',
        body.transactionIds,
        body.reviewed
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('POST /spaces/:spaceId/transactions/merchants/rename', () => {
    it('should call renameMerchant with spaceId, userId, oldName, and newName', async () => {
      const body = {
        oldName: 'STARBUCKS #1234',
        newName: 'Starbucks',
      };
      const mockResult = { count: 15 };

      transactionsService.renameMerchant.mockResolvedValue(mockResult as any);

      const result = await controller.renameMerchant('space-123', body, mockReq);

      expect(transactionsService.renameMerchant).toHaveBeenCalledWith(
        'space-123',
        'user-123',
        body.oldName,
        body.newName
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('POST /spaces/:spaceId/transactions/merchants/merge', () => {
    it('should call mergeMerchants with spaceId, userId, sourceNames, and targetName', async () => {
      const body = {
        sourceNames: ['STARBUCKS #1234', 'STARBUCKS #5678', 'Starbucks Corp'],
        targetName: 'Starbucks',
      };
      const mockResult = { count: 25 };

      transactionsService.mergeMerchants.mockResolvedValue(mockResult as any);

      const result = await controller.mergeMerchants('space-123', body, mockReq);

      expect(transactionsService.mergeMerchants).toHaveBeenCalledWith(
        'space-123',
        'user-123',
        body.sourceNames,
        body.targetName
      );
      expect(result).toEqual(mockResult);
    });
  });
});
