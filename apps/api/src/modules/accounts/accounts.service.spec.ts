import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { LoggerService } from '../../core/logger/logger.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { Provider, AccountType, Currency } from '@dhanam/shared';

describe('AccountsService', () => {
  let service: AccountsService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>(),
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            verbose: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllBySpace', () => {
    it('should return all accounts for a space', async () => {
      const spaceId = 'space_id';
      const mockAccounts = [
        {
          id: 'account1',
          spaceId,
          provider: 'manual' as Provider,
          providerAccountId: 'manual1',
          name: 'Test Account 1',
          type: 'checking' as AccountType,
          subtype: 'checking',
          currency: 'USD' as Currency,
          balance: 1000,
          lastSyncedAt: new Date(),
          isActive: true,
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'account2',
          spaceId,
          provider: 'belvo' as Provider,
          providerAccountId: 'belvo1',
          name: 'Test Account 2',
          type: 'savings' as AccountType,
          subtype: 'savings',
          currency: 'MXN' as Currency,
          balance: 5000,
          lastSyncedAt: new Date(),
          isActive: true,
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prisma.account.findMany.mockResolvedValue(mockAccounts);

      const result = await service.findAll(spaceId);

      expect(result).toEqual(mockAccounts);
      expect(prisma.account.findMany).toHaveBeenCalledWith({
        where: { spaceId },
      });
    });
  });

  describe('findOne', () => {
    it('should return an account by id', async () => {
      const spaceId = 'space_id';
      const accountId = 'account_id';
      const mockAccount = {
        id: accountId,
        spaceId,
        provider: 'manual' as Provider,
        providerAccountId: 'manual1',
        name: 'Test Account',
        type: 'checking' as AccountType,
        subtype: 'checking',
        currency: 'USD' as Currency,
        balance: 1000,
        lastSyncedAt: new Date(),
        isActive: true,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.account.findFirst.mockResolvedValue(mockAccount);

      const result = await service.findOne(accountId);

      expect(result).toEqual(mockAccount);
      expect(prisma.account.findFirst).toHaveBeenCalledWith({
        where: { id: accountId },
      });
    });

    it('should throw NotFoundException if account not found', async () => {
      const spaceId = 'space_id';
      const accountId = 'non_existent';

      prisma.account.findFirst.mockResolvedValue(null);

      await expect(service.findOne(accountId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('create', () => {
    it('should create a manual account', async () => {
      const spaceId = 'space_id';
      const createDto = {
        name: 'New Account',
        type: 'checking' as AccountType,
        currency: 'USD' as Currency,
        balance: 1000,
      };

      const mockAccount = {
        id: 'new_account_id',
        spaceId,
        provider: 'manual' as Provider,
        providerAccountId: expect.stringContaining('manual_'),
        name: createDto.name,
        type: createDto.type,
        subtype: createDto.type,
        currency: createDto.currency,
        balance: createDto.balance,
        lastSyncedAt: new Date(),
        isActive: true,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.account.create.mockResolvedValue(mockAccount);

      const result = await service.create(createDto, spaceId);

      expect(result).toEqual(mockAccount);
      expect(prisma.account.create).toHaveBeenCalledWith({
        data: {
          spaceId,
          provider: 'manual',
          providerAccountId: expect.stringContaining('manual_'),
          name: createDto.name,
          type: createDto.type,
          subtype: createDto.type,
          currency: createDto.currency,
          balance: createDto.balance,
          lastSyncedAt: expect.any(Date),
        },
      });
    });
  });

  describe('update', () => {
    it('should update an account', async () => {
      const spaceId = 'space_id';
      const accountId = 'account_id';
      const updateDto = {
        name: 'Updated Account',
        balance: 2000,
      };

      const existingAccount = {
        id: accountId,
        spaceId,
        provider: 'manual' as Provider,
        providerAccountId: 'manual1',
        name: 'Old Account',
        type: 'checking' as AccountType,
        subtype: 'checking',
        currency: 'USD' as Currency,
        balance: 1000,
        lastSyncedAt: new Date(),
        isActive: true,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedAccount = {
        ...existingAccount,
        ...updateDto,
      };

      prisma.account.findFirst.mockResolvedValue(existingAccount);
      prisma.account.update.mockResolvedValue(updatedAccount);

      const result = await service.update(accountId, updateDto);

      expect(result).toEqual(updatedAccount);
      expect(prisma.account.update).toHaveBeenCalledWith({
        where: { id: accountId },
        data: updateDto,
      });
    });

    it('should throw NotFoundException if account not found', async () => {
      const spaceId = 'space_id';
      const accountId = 'non_existent';
      const updateDto = { name: 'Updated' };

      prisma.account.findFirst.mockResolvedValue(null);

      await expect(service.update(accountId, updateDto)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('remove', () => {
    it('should delete an account and its transactions', async () => {
      const spaceId = 'space_id';
      const accountId = 'account_id';

      const mockAccount = {
        id: accountId,
        spaceId,
        provider: 'manual' as Provider,
        providerAccountId: 'manual1',
        name: 'Test Account',
        type: 'checking' as AccountType,
        subtype: 'checking',
        currency: 'USD' as Currency,
        balance: 1000,
        lastSyncedAt: new Date(),
        isActive: true,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.account.findFirst.mockResolvedValue(mockAccount);
      prisma.account.delete.mockResolvedValue(mockAccount);

      await service.remove(accountId);

      expect(prisma.account.delete).toHaveBeenCalledWith({
        where: { id: accountId },
      });
    });

    it('should throw NotFoundException if account not found', async () => {
      const spaceId = 'space_id';
      const accountId = 'non_existent';

      prisma.account.findFirst.mockResolvedValue(null);

      await expect(service.remove(accountId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('connectAccount', () => {
    it('should return mock connection for providers', async () => {
      const spaceId = 'space_id';
      const connectDto = { provider: 'belvo' as Exclude<Provider, 'manual'> };

      const result = await service.connectAccount(spaceId, 'userId', connectDto);

      expect(result).toEqual({
        url: expect.stringContaining('connect'),
        message: 'Belvo integration will be implemented',
      });
    });
  });
});