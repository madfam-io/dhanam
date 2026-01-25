import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { LoggerService } from '../../core/logger/logger.service';
import { PlaidService } from '../providers/plaid/plaid.service';
import { BitsoService } from '../providers/bitso/bitso.service';
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
        {
          provide: PlaidService,
          useValue: {
            createLink: jest.fn(),
            createLinkToken: jest.fn(),
            exchangePublicToken: jest.fn(),
            getAccounts: jest.fn(),
            getTransactions: jest.fn(),
            syncTransactions: jest.fn(),
          },
        },
        {
          provide: BitsoService,
          useValue: {
            connectAccount: jest.fn(),
            getAccounts: jest.fn(),
            getBalances: jest.fn(),
            getTransactions: jest.fn(),
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

      const result = await service.listAccounts(spaceId);

      expect(result).toHaveLength(2);
      expect(prisma.account.findMany).toHaveBeenCalledWith({
        where: { spaceId },
        orderBy: { createdAt: 'desc' },
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

      const result = await service.getAccount(spaceId, accountId);

      expect(result.id).toBe(accountId);
      expect(prisma.account.findFirst).toHaveBeenCalledWith({
        where: { id: accountId, spaceId },
      });
    });

    it('should throw NotFoundException if account not found', async () => {
      const spaceId = 'space_id';
      const accountId = 'non_existent';

      prisma.account.findFirst.mockResolvedValue(null);

      await expect(service.getAccount(spaceId, accountId)).rejects.toThrow(
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
        subtype: 'checking',
        currency: 'USD' as Currency,
        balance: 1000,
      };

      const mockAccount = {
        id: 'new_account_id',
        spaceId,
        provider: 'manual' as Provider,
        providerAccountId: null,
        name: createDto.name,
        type: createDto.type,
        subtype: createDto.subtype,
        currency: createDto.currency,
        balance: createDto.balance,
        lastSyncedAt: null,
        isActive: true,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.account.create.mockResolvedValue(mockAccount);

      const result = await service.createAccount(spaceId, createDto);

      expect(result.name).toBe(createDto.name);
      expect(prisma.account.create).toHaveBeenCalledWith({
        data: {
          spaceId,
          name: createDto.name,
          type: createDto.type,
          subtype: createDto.subtype,
          currency: createDto.currency,
          balance: createDto.balance,
          provider: 'manual',
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

      const result = await service.updateAccount(spaceId, accountId, updateDto);

      expect(result.name).toBe(updateDto.name);
      expect(prisma.account.update).toHaveBeenCalledWith({
        where: { id: accountId },
        data: {
          name: updateDto.name,
          balance: updateDto.balance,
        },
      });
    });

    it('should throw NotFoundException if account not found', async () => {
      const spaceId = 'space_id';
      const accountId = 'non_existent';
      const updateDto = { name: 'Updated' };

      prisma.account.findFirst.mockResolvedValue(null);

      await expect(service.updateAccount(spaceId, accountId, updateDto)).rejects.toThrow(
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

      await service.deleteAccount(spaceId, accountId);

      expect(prisma.account.delete).toHaveBeenCalledWith({
        where: { id: accountId },
      });
    });

    it('should throw NotFoundException if account not found', async () => {
      const spaceId = 'space_id';
      const accountId = 'non_existent';

      prisma.account.findFirst.mockResolvedValue(null);

      await expect(service.deleteAccount(spaceId, accountId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('connectAccount', () => {
    it('should throw for Belvo provider (use dedicated endpoint)', async () => {
      const spaceId = 'space_id';
      const userId = 'userId';
      const connectDto = { provider: 'belvo' as Exclude<Provider, 'manual'> };

      // Belvo connections should go through dedicated Belvo endpoint
      await expect(service.connectAccount(spaceId, userId, connectDto)).rejects.toThrow(
        'Belvo connections should be initiated through /providers/belvo/link endpoint'
      );
    });
  });
});
