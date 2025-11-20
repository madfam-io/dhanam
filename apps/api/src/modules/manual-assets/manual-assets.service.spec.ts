import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';

import { ManualAssetsService } from './manual-assets.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { SpacesService } from '../spaces/spaces.service';
import { CreateManualAssetDto, UpdateManualAssetDto, AddValuationDto } from './dto';

describe('ManualAssetsService', () => {
  let service: ManualAssetsService;
  let prismaService: jest.Mocked<PrismaService>;
  let spacesService: jest.Mocked<SpacesService>;

  const mockPrisma = {
    manualAsset: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    manualAssetValuation: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    space: {
      findUnique: jest.fn(),
    },
  };

  const mockSpacesService = {
    verifyUserAccess: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ManualAssetsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: SpacesService,
          useValue: mockSpacesService,
        },
      ],
    }).compile();

    service = module.get<ManualAssetsService>(ManualAssetsService);
    prismaService = module.get(PrismaService);
    spacesService = module.get(SpacesService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    const spaceId = 'space-1';
    const userId = 'user-1';

    it('should return all assets for a space', async () => {
      const mockAssets = [
        {
          id: 'asset-1',
          spaceId,
          name: 'Beach House',
          type: 'real_estate',
          description: 'Vacation home in Tulum',
          currentValue: new Decimal(500000),
          currency: 'USD',
          acquisitionDate: new Date('2020-01-15'),
          acquisitionCost: new Decimal(400000),
          metadata: { address: '123 Beach Rd', sqft: 2500 },
          documents: null,
          notes: 'Great investment',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-06-01'),
          valuationHistory: [
            {
              id: 'val-1',
              assetId: 'asset-1',
              date: new Date('2023-06-01'),
              value: new Decimal(500000),
              currency: 'USD',
              source: 'Appraisal',
              notes: null,
              createdAt: new Date('2023-06-01'),
            },
          ],
        },
        {
          id: 'asset-2',
          spaceId,
          name: 'Tesla Model 3',
          type: 'vehicle',
          description: null,
          currentValue: new Decimal(35000),
          currency: 'USD',
          acquisitionDate: new Date('2022-03-01'),
          acquisitionCost: new Decimal(45000),
          metadata: { vin: 'ABC123', year: 2022 },
          documents: null,
          notes: null,
          createdAt: new Date('2023-02-01'),
          updatedAt: new Date('2023-06-01'),
          valuationHistory: [],
        },
      ];

      mockSpacesService.verifyUserAccess.mockResolvedValue(undefined);
      mockPrisma.manualAsset.findMany.mockResolvedValue(mockAssets as any);

      const result = await service.findAll(spaceId, userId);

      expect(spacesService.verifyUserAccess).toHaveBeenCalledWith(userId, spaceId, 'viewer');
      expect(prismaService.manualAsset.findMany).toHaveBeenCalledWith({
        where: { spaceId },
        include: {
          valuationHistory: {
            orderBy: { date: 'desc' },
            take: 5,
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Beach House');
      expect(result[0].currentValue).toBe(500000);
      expect(result[0].valuationHistory).toHaveLength(1);
      expect(result[1].name).toBe('Tesla Model 3');
      expect(result[1].currentValue).toBe(35000);
    });

    it('should throw ForbiddenException if user lacks access', async () => {
      mockSpacesService.verifyUserAccess.mockRejectedValue(
        new ForbiddenException('Insufficient permissions')
      );

      await expect(service.findAll(spaceId, userId)).rejects.toThrow(ForbiddenException);
      expect(spacesService.verifyUserAccess).toHaveBeenCalledWith(userId, spaceId, 'viewer');
      expect(prismaService.manualAsset.findMany).not.toHaveBeenCalled();
    });

    it('should return empty array if no assets exist', async () => {
      mockSpacesService.verifyUserAccess.mockResolvedValue(undefined);
      mockPrisma.manualAsset.findMany.mockResolvedValue([]);

      const result = await service.findAll(spaceId, userId);

      expect(result).toEqual([]);
    });

    it('should include latest 5 valuations in history', async () => {
      const valuations = Array.from({ length: 7 }, (_, i) => ({
        id: `val-${i}`,
        assetId: 'asset-1',
        date: new Date(`2023-0${i + 1}-01`),
        value: new Decimal(500000 + i * 1000),
        currency: 'USD',
        source: `Valuation ${i}`,
        notes: null,
        createdAt: new Date(`2023-0${i + 1}-01`),
      }));

      const mockAsset = {
        id: 'asset-1',
        spaceId,
        name: 'Property',
        type: 'real_estate',
        description: null,
        currentValue: new Decimal(507000),
        currency: 'USD',
        acquisitionDate: null,
        acquisitionCost: null,
        metadata: null,
        documents: null,
        notes: null,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-07-01'),
        valuationHistory: valuations.slice(0, 5), // Should only get 5
      };

      mockSpacesService.verifyUserAccess.mockResolvedValue(undefined);
      mockPrisma.manualAsset.findMany.mockResolvedValue([mockAsset] as any);

      const result = await service.findAll(spaceId, userId);

      expect(result[0].valuationHistory).toHaveLength(5);
    });
  });

  describe('findOne', () => {
    const spaceId = 'space-1';
    const userId = 'user-1';
    const assetId = 'asset-1';

    it('should return a single asset', async () => {
      const mockAsset = {
        id: assetId,
        spaceId,
        name: 'Domain Portfolio',
        type: 'domain',
        description: 'Premium .com domains',
        currentValue: new Decimal(150000),
        currency: 'USD',
        acquisitionDate: new Date('2019-05-10'),
        acquisitionCost: new Decimal(100000),
        metadata: { domains: ['example.com', 'test.com'] },
        documents: null,
        notes: 'Valuable domains',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-06-01'),
        valuationHistory: [
          {
            id: 'val-1',
            assetId,
            date: new Date('2023-06-01'),
            value: new Decimal(150000),
            currency: 'USD',
            source: 'Market Analysis',
            notes: 'Based on recent sales',
            createdAt: new Date('2023-06-01'),
          },
        ],
      };

      mockSpacesService.verifyUserAccess.mockResolvedValue(undefined);
      mockPrisma.manualAsset.findFirst.mockResolvedValue(mockAsset as any);

      const result = await service.findOne(spaceId, userId, assetId);

      expect(spacesService.verifyUserAccess).toHaveBeenCalledWith(userId, spaceId, 'viewer');
      expect(prismaService.manualAsset.findFirst).toHaveBeenCalledWith({
        where: { id: assetId, spaceId },
        include: {
          valuationHistory: {
            orderBy: { date: 'desc' },
          },
        },
      });
      expect(result.id).toBe(assetId);
      expect(result.name).toBe('Domain Portfolio');
      expect(result.currentValue).toBe(150000);
      expect(result.valuationHistory).toHaveLength(1);
    });

    it('should throw NotFoundException if asset not found', async () => {
      mockSpacesService.verifyUserAccess.mockResolvedValue(undefined);
      mockPrisma.manualAsset.findFirst.mockResolvedValue(null);

      await expect(service.findOne(spaceId, userId, assetId)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(spaceId, userId, assetId)).rejects.toThrow(
        'Manual asset not found'
      );
    });

    it('should throw ForbiddenException if user lacks access', async () => {
      mockSpacesService.verifyUserAccess.mockRejectedValue(
        new ForbiddenException('Insufficient permissions')
      );

      await expect(service.findOne(spaceId, userId, assetId)).rejects.toThrow(ForbiddenException);
      expect(prismaService.manualAsset.findFirst).not.toHaveBeenCalled();
    });

    it('should include all valuations (not limited to 5)', async () => {
      const valuations = Array.from({ length: 10 }, (_, i) => ({
        id: `val-${i}`,
        assetId,
        date: new Date(`2023-${String(i + 1).padStart(2, '0')}-01`),
        value: new Decimal(500000 + i * 1000),
        currency: 'USD',
        source: `Source ${i}`,
        notes: null,
        createdAt: new Date(`2023-${String(i + 1).padStart(2, '0')}-01`),
      }));

      const mockAsset = {
        id: assetId,
        spaceId,
        name: 'Property',
        type: 'real_estate',
        description: null,
        currentValue: new Decimal(509000),
        currency: 'USD',
        acquisitionDate: null,
        acquisitionCost: null,
        metadata: null,
        documents: null,
        notes: null,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-10-01'),
        valuationHistory: valuations,
      };

      mockSpacesService.verifyUserAccess.mockResolvedValue(undefined);
      mockPrisma.manualAsset.findFirst.mockResolvedValue(mockAsset as any);

      const result = await service.findOne(spaceId, userId, assetId);

      expect(result.valuationHistory).toHaveLength(10);
    });
  });

  describe('create', () => {
    const spaceId = 'space-1';
    const userId = 'user-1';

    it('should create a new asset', async () => {
      const dto: CreateManualAssetDto = {
        name: 'Collectible Art',
        type: 'art',
        description: 'Modern art piece',
        currentValue: 25000,
        currency: 'USD',
        acquisitionDate: '2021-06-15',
        acquisitionCost: 20000,
        metadata: { artist: 'Unknown', year: 2020 },
        notes: 'Purchased at auction',
      };

      const mockAsset = {
        id: 'asset-new',
        spaceId,
        name: dto.name,
        type: dto.type,
        description: dto.description,
        currentValue: new Decimal(dto.currentValue),
        currency: dto.currency,
        acquisitionDate: new Date(dto.acquisitionDate),
        acquisitionCost: new Decimal(dto.acquisitionCost!),
        metadata: dto.metadata,
        documents: null,
        notes: dto.notes,
        createdAt: new Date('2023-07-01'),
        updatedAt: new Date('2023-07-01'),
        valuationHistory: [],
      };

      const mockValuation = {
        id: 'val-initial',
        assetId: 'asset-new',
        date: new Date(),
        value: new Decimal(dto.currentValue),
        currency: dto.currency,
        source: 'Initial Entry',
        notes: null,
        createdAt: new Date('2023-07-01'),
      };

      mockSpacesService.verifyUserAccess.mockResolvedValue(undefined);
      mockPrisma.manualAsset.create.mockResolvedValue(mockAsset as any);
      mockPrisma.manualAssetValuation.create.mockResolvedValue(mockValuation as any);

      const result = await service.create(spaceId, userId, dto);

      expect(spacesService.verifyUserAccess).toHaveBeenCalledWith(userId, spaceId, 'member');
      expect(prismaService.manualAsset.create).toHaveBeenCalledWith({
        data: {
          spaceId,
          name: dto.name,
          type: dto.type,
          description: dto.description,
          currentValue: dto.currentValue,
          currency: dto.currency,
          acquisitionDate: new Date(dto.acquisitionDate),
          acquisitionCost: dto.acquisitionCost,
          metadata: dto.metadata,
          notes: dto.notes,
        },
        include: {
          valuationHistory: true,
        },
      });
      expect(prismaService.manualAssetValuation.create).toHaveBeenCalledWith({
        data: {
          assetId: 'asset-new',
          date: expect.any(Date),
          value: dto.currentValue,
          currency: dto.currency,
          source: 'Initial Entry',
        },
      });
      expect(result.name).toBe(dto.name);
      expect(result.currentValue).toBe(25000);
    });

    it('should create initial valuation entry', async () => {
      const dto: CreateManualAssetDto = {
        name: 'Vehicle',
        type: 'vehicle',
        currentValue: 30000,
        currency: 'USD',
      };

      const mockAsset = {
        id: 'asset-new',
        spaceId,
        name: dto.name,
        type: dto.type,
        description: null,
        currentValue: new Decimal(dto.currentValue),
        currency: dto.currency,
        acquisitionDate: null,
        acquisitionCost: null,
        metadata: null,
        documents: null,
        notes: null,
        createdAt: new Date('2023-07-01'),
        updatedAt: new Date('2023-07-01'),
        valuationHistory: [],
      };

      mockSpacesService.verifyUserAccess.mockResolvedValue(undefined);
      mockPrisma.manualAsset.create.mockResolvedValue(mockAsset as any);
      mockPrisma.manualAssetValuation.create.mockResolvedValue({} as any);

      await service.create(spaceId, userId, dto);

      expect(prismaService.manualAssetValuation.create).toHaveBeenCalledTimes(1);
      expect(prismaService.manualAssetValuation.create).toHaveBeenCalledWith({
        data: {
          assetId: 'asset-new',
          date: expect.any(Date),
          value: dto.currentValue,
          currency: dto.currency,
          source: 'Initial Entry',
        },
      });
    });

    it('should require member role', async () => {
      const dto: CreateManualAssetDto = {
        name: 'Asset',
        type: 'other',
        currentValue: 10000,
        currency: 'USD',
      };

      mockSpacesService.verifyUserAccess.mockRejectedValue(
        new ForbiddenException('Insufficient permissions')
      );

      await expect(service.create(spaceId, userId, dto)).rejects.toThrow(ForbiddenException);
      expect(spacesService.verifyUserAccess).toHaveBeenCalledWith(userId, spaceId, 'member');
      expect(prismaService.manualAsset.create).not.toHaveBeenCalled();
    });

    it('should handle optional fields correctly', async () => {
      const dto: CreateManualAssetDto = {
        name: 'Minimal Asset',
        type: 'other',
        currentValue: 5000,
        currency: 'MXN',
        // No description, acquisitionDate, acquisitionCost, metadata, or notes
      };

      const mockAsset = {
        id: 'asset-minimal',
        spaceId,
        name: dto.name,
        type: dto.type,
        description: null,
        currentValue: new Decimal(dto.currentValue),
        currency: dto.currency,
        acquisitionDate: null,
        acquisitionCost: null,
        metadata: null,
        documents: null,
        notes: null,
        createdAt: new Date('2023-07-01'),
        updatedAt: new Date('2023-07-01'),
        valuationHistory: [],
      };

      mockSpacesService.verifyUserAccess.mockResolvedValue(undefined);
      mockPrisma.manualAsset.create.mockResolvedValue(mockAsset as any);
      mockPrisma.manualAssetValuation.create.mockResolvedValue({} as any);

      const result = await service.create(spaceId, userId, dto);

      expect(result.description).toBeNull();
      expect(result.acquisitionDate).toBeNull();
      expect(result.acquisitionCost).toBeNull();
      expect(result.metadata).toBeNull();
      expect(result.notes).toBeNull();
    });
  });

  describe('update', () => {
    const spaceId = 'space-1';
    const userId = 'user-1';
    const assetId = 'asset-1';

    it('should update an asset', async () => {
      const dto: UpdateManualAssetDto = {
        name: 'Updated Asset Name',
        currentValue: 600000,
        notes: 'Value increased',
      };

      const existingAsset = {
        id: assetId,
        spaceId,
        name: 'Old Name',
        type: 'real_estate',
        description: 'Description',
        currentValue: new Decimal(500000),
        currency: 'USD',
        acquisitionDate: new Date('2020-01-01'),
        acquisitionCost: new Decimal(400000),
        metadata: {},
        documents: null,
        notes: 'Old notes',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-06-01'),
      };

      const updatedAsset = {
        ...existingAsset,
        name: dto.name,
        currentValue: new Decimal(dto.currentValue!),
        notes: dto.notes,
        updatedAt: new Date('2023-07-01'),
        valuationHistory: [],
      };

      mockSpacesService.verifyUserAccess.mockResolvedValue(undefined);
      mockPrisma.manualAsset.findFirst.mockResolvedValue(existingAsset as any);
      mockPrisma.manualAsset.update.mockResolvedValue(updatedAsset as any);

      const result = await service.update(spaceId, userId, assetId, dto);

      expect(spacesService.verifyUserAccess).toHaveBeenCalledWith(userId, spaceId, 'member');
      expect(prismaService.manualAsset.findFirst).toHaveBeenCalledWith({
        where: { id: assetId, spaceId },
      });
      expect(prismaService.manualAsset.update).toHaveBeenCalledWith({
        where: { id: assetId },
        data: {
          name: dto.name,
          currentValue: dto.currentValue,
          notes: dto.notes,
        },
        include: {
          valuationHistory: {
            orderBy: { date: 'desc' },
            take: 5,
          },
        },
      });
      expect(result.name).toBe('Updated Asset Name');
      expect(result.currentValue).toBe(600000);
      expect(result.notes).toBe('Value increased');
    });

    it('should allow partial updates', async () => {
      const dto: UpdateManualAssetDto = {
        notes: 'Just updating notes',
      };

      const existingAsset = {
        id: assetId,
        spaceId,
        name: 'Asset',
        type: 'vehicle',
        description: 'Description',
        currentValue: new Decimal(30000),
        currency: 'USD',
        acquisitionDate: null,
        acquisitionCost: null,
        metadata: null,
        documents: null,
        notes: null,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-06-01'),
      };

      const updatedAsset = {
        ...existingAsset,
        notes: dto.notes,
        updatedAt: new Date('2023-07-01'),
        valuationHistory: [],
      };

      mockSpacesService.verifyUserAccess.mockResolvedValue(undefined);
      mockPrisma.manualAsset.findFirst.mockResolvedValue(existingAsset as any);
      mockPrisma.manualAsset.update.mockResolvedValue(updatedAsset as any);

      const result = await service.update(spaceId, userId, assetId, dto);

      expect(prismaService.manualAsset.update).toHaveBeenCalledWith({
        where: { id: assetId },
        data: {
          notes: dto.notes,
        },
        include: {
          valuationHistory: {
            orderBy: { date: 'desc' },
            take: 5,
          },
        },
      });
      expect(result.notes).toBe('Just updating notes');
    });

    it('should throw NotFoundException if asset not found', async () => {
      const dto: UpdateManualAssetDto = {
        name: 'Updated',
      };

      mockSpacesService.verifyUserAccess.mockResolvedValue(undefined);
      mockPrisma.manualAsset.findFirst.mockResolvedValue(null);

      await expect(service.update(spaceId, userId, assetId, dto)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.update(spaceId, userId, assetId, dto)).rejects.toThrow(
        'Manual asset not found'
      );
      expect(prismaService.manualAsset.update).not.toHaveBeenCalled();
    });

    it('should require member role', async () => {
      const dto: UpdateManualAssetDto = {
        name: 'Updated',
      };

      mockSpacesService.verifyUserAccess.mockRejectedValue(
        new ForbiddenException('Insufficient permissions')
      );

      await expect(service.update(spaceId, userId, assetId, dto)).rejects.toThrow(
        ForbiddenException
      );
      expect(spacesService.verifyUserAccess).toHaveBeenCalledWith(userId, spaceId, 'member');
      expect(prismaService.manualAsset.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    const spaceId = 'space-1';
    const userId = 'user-1';
    const assetId = 'asset-1';

    it('should delete an asset', async () => {
      const mockAsset = {
        id: assetId,
        spaceId,
        name: 'Asset to Delete',
        type: 'other',
        description: null,
        currentValue: new Decimal(10000),
        currency: 'USD',
        acquisitionDate: null,
        acquisitionCost: null,
        metadata: null,
        documents: null,
        notes: null,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-06-01'),
      };

      mockSpacesService.verifyUserAccess.mockResolvedValue(undefined);
      mockPrisma.manualAsset.findFirst.mockResolvedValue(mockAsset as any);
      mockPrisma.manualAsset.delete.mockResolvedValue(mockAsset as any);

      await service.remove(spaceId, userId, assetId);

      expect(spacesService.verifyUserAccess).toHaveBeenCalledWith(userId, spaceId, 'admin');
      expect(prismaService.manualAsset.findFirst).toHaveBeenCalledWith({
        where: { id: assetId, spaceId },
      });
      expect(prismaService.manualAsset.delete).toHaveBeenCalledWith({
        where: { id: assetId },
      });
    });

    it('should throw NotFoundException if asset not found', async () => {
      mockSpacesService.verifyUserAccess.mockResolvedValue(undefined);
      mockPrisma.manualAsset.findFirst.mockResolvedValue(null);

      await expect(service.remove(spaceId, userId, assetId)).rejects.toThrow(NotFoundException);
      await expect(service.remove(spaceId, userId, assetId)).rejects.toThrow(
        'Manual asset not found'
      );
      expect(prismaService.manualAsset.delete).not.toHaveBeenCalled();
    });

    it('should require admin role', async () => {
      mockSpacesService.verifyUserAccess.mockRejectedValue(
        new ForbiddenException('Insufficient permissions')
      );

      await expect(service.remove(spaceId, userId, assetId)).rejects.toThrow(ForbiddenException);
      expect(spacesService.verifyUserAccess).toHaveBeenCalledWith(userId, spaceId, 'admin');
      expect(prismaService.manualAsset.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('addValuation', () => {
    const spaceId = 'space-1';
    const userId = 'user-1';
    const assetId = 'asset-1';

    it('should add a valuation to an asset', async () => {
      const dto: AddValuationDto = {
        date: '2023-07-01',
        value: 550000,
        currency: 'USD',
        source: 'Professional Appraisal',
        notes: 'Market conditions improved',
      };

      const mockAsset = {
        id: assetId,
        spaceId,
      };

      const mockValuation = {
        id: 'val-new',
        assetId,
        date: new Date(dto.date),
        value: new Decimal(dto.value),
        currency: dto.currency,
        source: dto.source,
        notes: dto.notes,
        createdAt: new Date('2023-07-01'),
      };

      mockSpacesService.verifyUserAccess.mockResolvedValue(undefined);
      mockPrisma.manualAsset.findFirst.mockResolvedValue(mockAsset as any);
      mockPrisma.manualAssetValuation.create.mockResolvedValue(mockValuation as any);
      mockPrisma.manualAssetValuation.findFirst.mockResolvedValue(mockValuation as any);
      mockPrisma.manualAsset.update.mockResolvedValue({} as any);

      const result = await service.addValuation(spaceId, userId, assetId, dto);

      expect(spacesService.verifyUserAccess).toHaveBeenCalledWith(userId, spaceId, 'member');
      expect(prismaService.manualAsset.findFirst).toHaveBeenCalledWith({
        where: { id: assetId, spaceId },
      });
      expect(prismaService.manualAssetValuation.create).toHaveBeenCalledWith({
        data: {
          assetId,
          date: new Date(dto.date),
          value: dto.value,
          currency: dto.currency,
          source: dto.source,
          notes: dto.notes,
        },
      });
      expect(result.id).toBe('val-new');
      expect(result.value).toBe(550000);
      expect(result.source).toBe('Professional Appraisal');
    });

    it('should update currentValue if this is the latest valuation', async () => {
      const dto: AddValuationDto = {
        date: '2023-08-01',
        value: 600000,
        currency: 'USD',
        source: 'Market Update',
      };

      const mockAsset = {
        id: assetId,
        spaceId,
      };

      const mockValuation = {
        id: 'val-latest',
        assetId,
        date: new Date(dto.date),
        value: new Decimal(dto.value),
        currency: dto.currency,
        source: dto.source,
        notes: null,
        createdAt: new Date('2023-08-01'),
      };

      mockSpacesService.verifyUserAccess.mockResolvedValue(undefined);
      mockPrisma.manualAsset.findFirst.mockResolvedValue(mockAsset as any);
      mockPrisma.manualAssetValuation.create.mockResolvedValue(mockValuation as any);
      mockPrisma.manualAssetValuation.findFirst.mockResolvedValue(mockValuation as any);
      mockPrisma.manualAsset.update.mockResolvedValue({} as any);

      await service.addValuation(spaceId, userId, assetId, dto);

      // Should update the asset's currentValue since this is the latest valuation
      expect(prismaService.manualAsset.update).toHaveBeenCalledWith({
        where: { id: assetId },
        data: { currentValue: dto.value },
      });
    });

    it('should not update currentValue if this is not the latest valuation', async () => {
      const dto: AddValuationDto = {
        date: '2023-05-01', // Older date
        value: 480000,
        currency: 'USD',
        source: 'Historical Data',
      };

      const mockAsset = {
        id: assetId,
        spaceId,
      };

      const createdValuation = {
        id: 'val-historical',
        assetId,
        date: new Date(dto.date),
        value: new Decimal(dto.value),
        currency: dto.currency,
        source: dto.source,
        notes: null,
        createdAt: new Date('2023-07-01'),
      };

      const latestValuation = {
        id: 'val-latest',
        assetId,
        date: new Date('2023-07-01'), // More recent
        value: new Decimal(550000),
        currency: 'USD',
        source: 'Latest',
        notes: null,
        createdAt: new Date('2023-07-01'),
      };

      mockSpacesService.verifyUserAccess.mockResolvedValue(undefined);
      mockPrisma.manualAsset.findFirst.mockResolvedValue(mockAsset as any);
      mockPrisma.manualAssetValuation.create.mockResolvedValue(createdValuation as any);
      mockPrisma.manualAssetValuation.findFirst.mockResolvedValue(latestValuation as any);

      await service.addValuation(spaceId, userId, assetId, dto);

      // Should NOT update the asset's currentValue since this is not the latest
      expect(prismaService.manualAsset.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if asset not found', async () => {
      const dto: AddValuationDto = {
        date: '2023-07-01',
        value: 100000,
        currency: 'USD',
        source: 'Test',
      };

      mockSpacesService.verifyUserAccess.mockResolvedValue(undefined);
      mockPrisma.manualAsset.findFirst.mockResolvedValue(null);

      await expect(service.addValuation(spaceId, userId, assetId, dto)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.addValuation(spaceId, userId, assetId, dto)).rejects.toThrow(
        'Manual asset not found'
      );
      expect(prismaService.manualAssetValuation.create).not.toHaveBeenCalled();
    });

    it('should require member role', async () => {
      const dto: AddValuationDto = {
        date: '2023-07-01',
        value: 100000,
        currency: 'USD',
        source: 'Test',
      };

      mockSpacesService.verifyUserAccess.mockRejectedValue(
        new ForbiddenException('Insufficient permissions')
      );

      await expect(service.addValuation(spaceId, userId, assetId, dto)).rejects.toThrow(
        ForbiddenException
      );
      expect(spacesService.verifyUserAccess).toHaveBeenCalledWith(userId, spaceId, 'member');
      expect(prismaService.manualAsset.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('getSummary', () => {
    const spaceId = 'space-1';
    const userId = 'user-1';

    it('should return summary with totals', async () => {
      const mockAssets = [
        {
          id: 'asset-1',
          spaceId,
          name: 'House',
          type: 'real_estate',
          currentValue: new Decimal(500000),
          acquisitionCost: new Decimal(400000),
        },
        {
          id: 'asset-2',
          spaceId,
          name: 'Car',
          type: 'vehicle',
          currentValue: new Decimal(35000),
          acquisitionCost: new Decimal(45000),
        },
      ];

      const mockSpace = {
        id: spaceId,
        currency: 'USD',
      };

      mockSpacesService.verifyUserAccess.mockResolvedValue(undefined);
      mockPrisma.manualAsset.findMany.mockResolvedValue(mockAssets as any);
      mockPrisma.space.findUnique.mockResolvedValue(mockSpace as any);

      const result = await service.getSummary(spaceId, userId);

      expect(spacesService.verifyUserAccess).toHaveBeenCalledWith(userId, spaceId, 'viewer');
      expect(result.totalAssets).toBe(2);
      expect(result.totalValue).toBe(535000);
      expect(result.currency).toBe('USD');
      expect(result.unrealizedGain).toBe(90000); // (500000 - 400000) + (35000 - 45000)
    });

    it('should aggregate by asset type', async () => {
      const mockAssets = [
        {
          id: 'asset-1',
          spaceId,
          name: 'House 1',
          type: 'real_estate',
          currentValue: new Decimal(500000),
          acquisitionCost: new Decimal(400000),
        },
        {
          id: 'asset-2',
          spaceId,
          name: 'House 2',
          type: 'real_estate',
          currentValue: new Decimal(300000),
          acquisitionCost: new Decimal(250000),
        },
        {
          id: 'asset-3',
          spaceId,
          name: 'Car',
          type: 'vehicle',
          currentValue: new Decimal(35000),
          acquisitionCost: new Decimal(45000),
        },
        {
          id: 'asset-4',
          spaceId,
          name: 'Domain',
          type: 'domain',
          currentValue: new Decimal(150000),
          acquisitionCost: new Decimal(100000),
        },
      ];

      const mockSpace = {
        id: spaceId,
        currency: 'MXN',
      };

      mockSpacesService.verifyUserAccess.mockResolvedValue(undefined);
      mockPrisma.manualAsset.findMany.mockResolvedValue(mockAssets as any);
      mockPrisma.space.findUnique.mockResolvedValue(mockSpace as any);

      const result = await service.getSummary(spaceId, userId);

      expect(result.totalAssets).toBe(4);
      expect(result.totalValue).toBe(985000);
      expect(result.byType).toEqual({
        real_estate: {
          count: 2,
          value: 800000,
        },
        vehicle: {
          count: 1,
          value: 35000,
        },
        domain: {
          count: 1,
          value: 150000,
        },
      });
    });

    it('should calculate unrealized gain correctly', async () => {
      const mockAssets = [
        {
          id: 'asset-1',
          spaceId,
          name: 'Winner',
          type: 'collectible',
          currentValue: new Decimal(100000),
          acquisitionCost: new Decimal(50000), // +50k gain
        },
        {
          id: 'asset-2',
          spaceId,
          name: 'Loser',
          type: 'vehicle',
          currentValue: new Decimal(20000),
          acquisitionCost: new Decimal(40000), // -20k loss
        },
        {
          id: 'asset-3',
          spaceId,
          name: 'Unknown',
          type: 'art',
          currentValue: new Decimal(75000),
          acquisitionCost: null, // No acquisition cost
        },
      ];

      const mockSpace = {
        id: spaceId,
        currency: 'EUR',
      };

      mockSpacesService.verifyUserAccess.mockResolvedValue(undefined);
      mockPrisma.manualAsset.findMany.mockResolvedValue(mockAssets as any);
      mockPrisma.space.findUnique.mockResolvedValue(mockSpace as any);

      const result = await service.getSummary(spaceId, userId);

      // (+50k - 20k + 75k) = 105k total unrealized gain
      expect(result.unrealizedGain).toBe(105000);
    });

    it('should handle empty asset list', async () => {
      const mockSpace = {
        id: spaceId,
        currency: 'USD',
      };

      mockSpacesService.verifyUserAccess.mockResolvedValue(undefined);
      mockPrisma.manualAsset.findMany.mockResolvedValue([]);
      mockPrisma.space.findUnique.mockResolvedValue(mockSpace as any);

      const result = await service.getSummary(spaceId, userId);

      expect(result.totalAssets).toBe(0);
      expect(result.totalValue).toBe(0);
      expect(result.byType).toEqual({});
      expect(result.unrealizedGain).toBe(0);
    });

    it('should default to USD if space has no currency', async () => {
      const mockSpace = {
        id: spaceId,
        currency: null,
      };

      mockSpacesService.verifyUserAccess.mockResolvedValue(undefined);
      mockPrisma.manualAsset.findMany.mockResolvedValue([]);
      mockPrisma.space.findUnique.mockResolvedValue(mockSpace as any);

      const result = await service.getSummary(spaceId, userId);

      expect(result.currency).toBe('USD');
    });
  });
});
