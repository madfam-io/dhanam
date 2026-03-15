import { Test, TestingModule } from '@nestjs/testing';

import { AuditService } from '../../../core/audit/audit.service';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { GdprController } from '../gdpr.controller';

describe('GdprController', () => {
  let controller: GdprController;
  let prisma: jest.Mocked<PrismaService>;
  let auditService: jest.Mocked<AuditService>;

  const mockUser = {
    userId: 'user-123',
    email: 'test@example.com',
  };

  const mockUserData = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    locale: 'es',
    timezone: 'America/Mexico_City',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2026-01-01'),
    emailVerified: true,
    onboardingCompleted: true,
    subscriptionTier: 'pro',
  };

  const mockSpaces = [
    {
      userId: 'user-123',
      spaceId: 'space-1',
      role: 'owner',
      space: { id: 'space-1', name: 'Personal', type: 'personal' },
    },
  ];

  const mockAccounts = [
    {
      id: 'account-1',
      name: 'Checking',
      type: 'checking',
      provider: 'belvo',
      currency: 'MXN',
      balance: { toFixed: () => '5000.00' },
      createdAt: new Date('2025-06-01'),
    },
  ];

  const mockTransactions = [
    {
      id: 'txn-1',
      amount: { toFixed: () => '-100.00' },
      currency: 'MXN',
      description: 'Groceries',
      merchant: 'Supermarket',
      date: new Date('2026-01-15'),
      createdAt: new Date('2026-01-15'),
    },
  ];

  const mockAuditLogs = [{ action: 'LOGIN', resource: 'user', timestamp: new Date('2026-01-10') }];

  const mockPreferences = {
    userId: 'user-123',
    weeklyReports: true,
    monthlyReports: false,
    exportFormat: 'pdf',
  };

  const mockRes = () => ({
    setHeader: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GdprController],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn().mockResolvedValue(mockUserData),
              update: jest.fn().mockResolvedValue({}),
            },
            userSpace: {
              findMany: jest.fn().mockResolvedValue(mockSpaces),
            },
            account: {
              findMany: jest.fn().mockResolvedValue(mockAccounts),
            },
            transaction: {
              findMany: jest.fn().mockResolvedValue(mockTransactions),
            },
            userPreferences: {
              findUnique: jest.fn().mockResolvedValue(mockPreferences),
            },
          },
        },
        {
          provide: AuditService,
          useValue: {
            logEvent: jest.fn().mockResolvedValue(undefined),
            exportUserAuditLogs: jest.fn().mockResolvedValue(mockAuditLogs),
          },
        },
      ],
    }).compile();

    controller = module.get<GdprController>(GdprController);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    auditService = module.get(AuditService) as jest.Mocked<AuditService>;

    jest.clearAllMocks();

    // Re-apply default mocks after clearAllMocks
    prisma.user.findUnique.mockResolvedValue(mockUserData as any);
    prisma.userSpace.findMany.mockResolvedValue(mockSpaces as any);
    prisma.account.findMany.mockResolvedValue(mockAccounts as any);
    prisma.transaction.findMany.mockResolvedValue(mockTransactions as any);
    prisma.userPreferences.findUnique.mockResolvedValue(mockPreferences as any);
    auditService.exportUserAuditLogs.mockResolvedValue(mockAuditLogs);
    auditService.logEvent.mockResolvedValue(undefined);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('exportUserData', () => {
    describe('json format (default)', () => {
      it('should return JSON export when no format specified', async () => {
        const result = await controller.exportUserData(mockUser as any);

        expect(result).toHaveProperty('exportedAt');
        expect(result).toHaveProperty('user');
        expect(result).toHaveProperty('spaces');
        expect(result).toHaveProperty('accounts');
        expect(result).toHaveProperty('transactions');
        expect(result).toHaveProperty('auditLogs');
        expect(result).toHaveProperty('preferences');
      });

      it('should return JSON export when format is json', async () => {
        const result = await controller.exportUserData(mockUser as any, 'json');

        expect(result).toHaveProperty('exportedAt');
        expect(result).toHaveProperty('user');
      });

      it('should log GDPR_DATA_EXPORT audit event', async () => {
        await controller.exportUserData(mockUser as any);

        expect(auditService.logEvent).toHaveBeenCalledWith({
          action: 'GDPR_DATA_EXPORT',
          resource: 'user',
          resourceId: 'user-123',
          userId: 'user-123',
          severity: 'high',
        });
      });

      it('should fetch all user data in parallel', async () => {
        await controller.exportUserData(mockUser as any);

        expect(prisma.user.findUnique).toHaveBeenCalledWith({
          where: { id: 'user-123' },
          select: expect.objectContaining({ id: true, email: true }),
        });
        expect(prisma.userSpace.findMany).toHaveBeenCalledWith({
          where: { userId: 'user-123' },
          include: { space: true },
        });
        expect(prisma.account.findMany).toHaveBeenCalled();
        expect(prisma.transaction.findMany).toHaveBeenCalled();
        expect(auditService.exportUserAuditLogs).toHaveBeenCalledWith('user-123');
        expect(prisma.userPreferences.findUnique).toHaveBeenCalledWith({
          where: { userId: 'user-123' },
        });
      });

      it('should map spaces correctly', async () => {
        const result = await controller.exportUserData(mockUser as any);

        expect(result.spaces).toEqual([
          { id: 'space-1', name: 'Personal', type: 'personal', role: 'owner' },
        ]);
      });
    });

    describe('csv format', () => {
      it('should return CSV string when format is csv', async () => {
        const res = mockRes();
        const result = await controller.exportUserData(mockUser as any, 'csv', res as any);

        expect(typeof result).toBe('string');
        expect(result).toContain('# User Data');
        expect(result).toContain('# Accounts');
        expect(result).toContain('# Transactions');
      });

      it('should set CSV content headers', async () => {
        const res = mockRes();
        await controller.exportUserData(mockUser as any, 'csv', res as any);

        expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
        expect(res.setHeader).toHaveBeenCalledWith(
          'Content-Disposition',
          'attachment; filename="dhanam-gdpr-export.csv"'
        );
      });

      it('should include spaces section in CSV', async () => {
        const res = mockRes();
        const result = await controller.exportUserData(mockUser as any, 'csv', res as any);

        expect(result).toContain('# Spaces');
      });
    });

    describe('zip format', () => {
      it('should return a Buffer when format is zip', async () => {
        const res = mockRes();
        const result = await controller.exportUserData(mockUser as any, 'zip', res as any);

        expect(Buffer.isBuffer(result)).toBe(true);
      });

      it('should set ZIP content headers', async () => {
        const res = mockRes();
        await controller.exportUserData(mockUser as any, 'zip', res as any);

        expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/zip');
        expect(res.setHeader).toHaveBeenCalledWith(
          'Content-Disposition',
          'attachment; filename="dhanam-gdpr-export.zip"'
        );
      });

      it('should produce a valid ZIP file starting with PK signature', async () => {
        const res = mockRes();
        const result = (await controller.exportUserData(
          mockUser as any,
          'zip',
          res as any
        )) as Buffer;

        // ZIP files start with PK\x03\x04 (local file header signature)
        expect(result[0]).toBe(0x50); // 'P'
        expect(result[1]).toBe(0x4b); // 'K'
        expect(result[2]).toBe(0x03);
        expect(result[3]).toBe(0x04);
      });

      it('should contain end of central directory record', async () => {
        const res = mockRes();
        const result = (await controller.exportUserData(
          mockUser as any,
          'zip',
          res as any
        )) as Buffer;

        // ZIP files end with PK\x05\x06 (end of central directory signature)
        const lastBytes = result.slice(-22);
        expect(lastBytes[0]).toBe(0x50); // 'P'
        expect(lastBytes[1]).toBe(0x4b); // 'K'
        expect(lastBytes[2]).toBe(0x05);
        expect(lastBytes[3]).toBe(0x06);
      });
    });

    describe('invalid format', () => {
      it('should throw BadRequestException for invalid format', async () => {
        await expect(controller.exportUserData(mockUser as any, 'xml' as any)).rejects.toThrow(
          'Invalid format'
        );
      });
    });
  });

  describe('requestDeletion', () => {
    it('should soft-delete user and return deletion date', async () => {
      prisma.user.update.mockResolvedValue({} as any);

      const result = await controller.requestDeletion(mockUser as any);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          deletedAt: expect.any(Date),
          isActive: false,
        },
      });
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('deletionDate');
      expect(result.message).toContain('30 days');
    });

    it('should log GDPR_DELETION_REQUESTED audit event', async () => {
      prisma.user.update.mockResolvedValue({} as any);

      await controller.requestDeletion(mockUser as any);

      expect(auditService.logEvent).toHaveBeenCalledWith({
        action: 'GDPR_DELETION_REQUESTED',
        resource: 'user',
        resourceId: 'user-123',
        userId: 'user-123',
        severity: 'critical',
      });
    });
  });
});
