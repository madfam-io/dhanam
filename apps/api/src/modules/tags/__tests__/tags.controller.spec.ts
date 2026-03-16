import { Test, TestingModule } from '@nestjs/testing';

import { TagsController } from '../tags.controller';
import { TagsService } from '../tags.service';

// Define DTO types inline to avoid import issues with decorators
type CreateTagDto = {
  name: string;
  description?: string;
  color?: string;
  sortOrder?: number;
};

type UpdateTagDto = {
  name?: string;
  description?: string;
  color?: string;
  sortOrder?: number;
};

describe('TagsController', () => {
  let controller: TagsController;
  let tagsService: jest.Mocked<TagsService>;

  const mockReq = { user: { id: 'user-123' } } as any;

  const mockTag = {
    id: 'tag-123',
    spaceId: 'space-123',
    name: 'Groceries',
    description: 'Grocery purchases',
    color: '#ef4444',
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTagWithCount = {
    ...mockTag,
    _count: { transactions: 5 },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TagsController],
      providers: [
        {
          provide: TagsService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            bulkAssign: jest.fn(),
            bulkRemove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TagsController>(TagsController);
    tagsService = module.get(TagsService) as jest.Mocked<TagsService>;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /spaces/:spaceId/tags', () => {
    it('should call service findAll with correct params', async () => {
      const mockTags = [
        mockTagWithCount,
        { ...mockTagWithCount, id: 'tag-456', name: 'Transport' },
      ];
      tagsService.findAll.mockResolvedValue(mockTags as any);

      await controller.findAll('space-123', mockReq);

      expect(tagsService.findAll).toHaveBeenCalledWith('space-123', 'user-123');
    });

    it('should return service result', async () => {
      const mockTags = [mockTagWithCount];
      tagsService.findAll.mockResolvedValue(mockTags as any);

      const result = await controller.findAll('space-123', mockReq);

      expect(result).toEqual(mockTags);
    });

    it('should return empty array when no tags exist', async () => {
      tagsService.findAll.mockResolvedValue([] as any);

      const result = await controller.findAll('space-123', mockReq);

      expect(result).toEqual([]);
    });
  });

  describe('GET /spaces/:spaceId/tags/:id', () => {
    it('should call service findOne with correct params', async () => {
      tagsService.findOne.mockResolvedValue(mockTagWithCount as any);

      await controller.findOne('space-123', 'tag-123', mockReq);

      expect(tagsService.findOne).toHaveBeenCalledWith('space-123', 'user-123', 'tag-123');
    });

    it('should return service result', async () => {
      tagsService.findOne.mockResolvedValue(mockTagWithCount as any);

      const result = await controller.findOne('space-123', 'tag-123', mockReq);

      expect(result).toEqual(mockTagWithCount);
    });
  });

  describe('POST /spaces/:spaceId/tags', () => {
    const createDto: CreateTagDto = {
      name: 'Groceries',
      description: 'Grocery purchases',
      color: '#ef4444',
      sortOrder: 0,
    };

    it('should call service create with correct params', async () => {
      tagsService.create.mockResolvedValue(mockTagWithCount as any);

      await controller.create('space-123', createDto as any, mockReq);

      expect(tagsService.create).toHaveBeenCalledWith('space-123', 'user-123', createDto);
    });

    it('should return service result', async () => {
      tagsService.create.mockResolvedValue(mockTagWithCount as any);

      const result = await controller.create('space-123', createDto as any, mockReq);

      expect(result).toEqual(mockTagWithCount);
    });

    it('should pass dto with only required fields', async () => {
      const minimalDto: CreateTagDto = { name: 'Bills' };
      tagsService.create.mockResolvedValue({ ...mockTagWithCount, name: 'Bills' } as any);

      await controller.create('space-123', minimalDto as any, mockReq);

      expect(tagsService.create).toHaveBeenCalledWith('space-123', 'user-123', minimalDto);
    });
  });

  describe('PATCH /spaces/:spaceId/tags/:id', () => {
    const updateDto: UpdateTagDto = {
      name: 'Updated Groceries',
      color: '#22c55e',
    };

    it('should call service update with correct params', async () => {
      const updatedTag = { ...mockTagWithCount, ...updateDto };
      tagsService.update.mockResolvedValue(updatedTag as any);

      await controller.update('space-123', 'tag-123', updateDto as any, mockReq);

      expect(tagsService.update).toHaveBeenCalledWith(
        'space-123',
        'user-123',
        'tag-123',
        updateDto
      );
    });

    it('should return service result', async () => {
      const updatedTag = { ...mockTagWithCount, ...updateDto };
      tagsService.update.mockResolvedValue(updatedTag as any);

      const result = await controller.update('space-123', 'tag-123', updateDto as any, mockReq);

      expect(result).toEqual(updatedTag);
    });

    it('should handle partial update with single field', async () => {
      const partialDto: UpdateTagDto = { sortOrder: 5 };
      const updatedTag = { ...mockTagWithCount, sortOrder: 5 };
      tagsService.update.mockResolvedValue(updatedTag as any);

      await controller.update('space-123', 'tag-123', partialDto as any, mockReq);

      expect(tagsService.update).toHaveBeenCalledWith(
        'space-123',
        'user-123',
        'tag-123',
        partialDto
      );
    });
  });

  describe('DELETE /spaces/:spaceId/tags/:id', () => {
    it('should call service remove with correct params', async () => {
      tagsService.remove.mockResolvedValue(undefined as any);

      await controller.remove('space-123', 'tag-123', mockReq);

      expect(tagsService.remove).toHaveBeenCalledWith('space-123', 'user-123', 'tag-123');
    });

    it('should return service result', async () => {
      tagsService.remove.mockResolvedValue(undefined as any);

      const result = await controller.remove('space-123', 'tag-123', mockReq);

      expect(result).toBeUndefined();
    });
  });

  describe('POST /spaces/:spaceId/tags/bulk-assign', () => {
    const bulkBody = {
      transactionIds: ['tx-1', 'tx-2', 'tx-3'],
      tagIds: ['tag-123', 'tag-456'],
    };

    it('should call service bulkAssign with correct params', async () => {
      tagsService.bulkAssign.mockResolvedValue({ assigned: 6 } as any);

      await controller.bulkAssign('space-123', bulkBody, mockReq);

      expect(tagsService.bulkAssign).toHaveBeenCalledWith(
        'space-123',
        'user-123',
        ['tx-1', 'tx-2', 'tx-3'],
        ['tag-123', 'tag-456']
      );
    });

    it('should return service result', async () => {
      tagsService.bulkAssign.mockResolvedValue({ assigned: 6 } as any);

      const result = await controller.bulkAssign('space-123', bulkBody, mockReq);

      expect(result).toEqual({ assigned: 6 });
    });

    it('should handle single transaction and tag', async () => {
      const singleBody = { transactionIds: ['tx-1'], tagIds: ['tag-123'] };
      tagsService.bulkAssign.mockResolvedValue({ assigned: 1 } as any);

      const result = await controller.bulkAssign('space-123', singleBody, mockReq);

      expect(tagsService.bulkAssign).toHaveBeenCalledWith(
        'space-123',
        'user-123',
        ['tx-1'],
        ['tag-123']
      );
      expect(result).toEqual({ assigned: 1 });
    });
  });

  describe('POST /spaces/:spaceId/tags/bulk-remove', () => {
    const bulkBody = {
      transactionIds: ['tx-1', 'tx-2'],
      tagIds: ['tag-123'],
    };

    it('should call service bulkRemove with correct params', async () => {
      tagsService.bulkRemove.mockResolvedValue({ removed: 2 } as any);

      await controller.bulkRemoveTags('space-123', bulkBody, mockReq);

      expect(tagsService.bulkRemove).toHaveBeenCalledWith(
        'space-123',
        'user-123',
        ['tx-1', 'tx-2'],
        ['tag-123']
      );
    });

    it('should return service result', async () => {
      tagsService.bulkRemove.mockResolvedValue({ removed: 2 } as any);

      const result = await controller.bulkRemoveTags('space-123', bulkBody, mockReq);

      expect(result).toEqual({ removed: 2 });
    });

    it('should handle removing multiple tags from multiple transactions', async () => {
      const multiBody = {
        transactionIds: ['tx-1', 'tx-2', 'tx-3'],
        tagIds: ['tag-123', 'tag-456', 'tag-789'],
      };
      tagsService.bulkRemove.mockResolvedValue({ removed: 9 } as any);

      const result = await controller.bulkRemoveTags('space-123', multiBody, mockReq);

      expect(tagsService.bulkRemove).toHaveBeenCalledWith(
        'space-123',
        'user-123',
        ['tx-1', 'tx-2', 'tx-3'],
        ['tag-123', 'tag-456', 'tag-789']
      );
      expect(result).toEqual({ removed: 9 });
    });
  });
});
