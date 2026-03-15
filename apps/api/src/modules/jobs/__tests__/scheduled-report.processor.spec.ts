import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../../core/prisma/prisma.service';
import { ReportService } from '../../analytics/report.service';
import { ScheduledReportProcessor } from '../processors/scheduled-report.processor';
import { QueueService } from '../queue.service';

describe('ScheduledReportProcessor', () => {
  let processor: ScheduledReportProcessor;
  let prisma: jest.Mocked<PrismaService>;
  let reportService: jest.Mocked<ReportService>;
  let queueService: jest.Mocked<QueueService>;

  const mockUser = {
    id: 'user-123',
    email: 'user@example.com',
    isActive: true,
    userSpaces: [
      {
        spaceId: 'space-1',
        space: { name: 'Personal Space' },
      },
    ],
  };

  const mockPrefsWeekly = {
    weeklyReports: true,
    exportFormat: 'pdf',
    user: mockUser,
  };

  const mockPrefsMonthly = {
    monthlyReports: true,
    exportFormat: 'csv',
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduledReportProcessor,
        {
          provide: PrismaService,
          useValue: {
            userPreferences: {
              findMany: jest.fn(),
            },
            space: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: ReportService,
          useValue: {
            generatePdfReport: jest.fn(),
            generateExcelExport: jest.fn(),
            generateCsvExport: jest.fn(),
          },
        },
        {
          provide: QueueService,
          useValue: {
            addEmailJob: jest.fn(),
          },
        },
      ],
    }).compile();

    processor = module.get<ScheduledReportProcessor>(ScheduledReportProcessor);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    reportService = module.get(ReportService) as jest.Mocked<ReportService>;
    queueService = module.get(QueueService) as jest.Mocked<QueueService>;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should log initialization message', async () => {
      await expect(processor.onModuleInit()).resolves.not.toThrow();
    });
  });

  describe('processWeeklyReports', () => {
    it('should generate weekly reports for active users with weekly reports enabled', async () => {
      prisma.userPreferences.findMany.mockResolvedValue([mockPrefsWeekly] as any);
      reportService.generatePdfReport.mockResolvedValue(Buffer.from('pdf-content'));
      queueService.addEmailJob.mockResolvedValue(null);

      await processor.processWeeklyReports();

      expect(prisma.userPreferences.findMany).toHaveBeenCalledWith({
        where: { weeklyReports: true },
        include: {
          user: {
            include: {
              userSpaces: {
                include: {
                  space: true,
                },
              },
            },
          },
        },
      });
      expect(reportService.generatePdfReport).toHaveBeenCalledWith(
        'space-1',
        expect.any(Date),
        expect.any(Date)
      );
      expect(queueService.addEmailJob).toHaveBeenCalledWith({
        to: 'user@example.com',
        template: 'scheduled-weekly-report',
        data: expect.objectContaining({
          spaceName: 'Personal Space',
          reportType: 'weekly',
          startDate: expect.any(String),
          endDate: expect.any(String),
          attachment: expect.objectContaining({
            filename: expect.stringContaining('weekly-report'),
            content: expect.any(String),
            contentType: 'application/pdf',
          }),
        }),
      });
    });

    it('should skip inactive users', async () => {
      const inactivePrefs = {
        ...mockPrefsWeekly,
        user: { ...mockUser, isActive: false },
      };
      prisma.userPreferences.findMany.mockResolvedValue([inactivePrefs] as any);

      await processor.processWeeklyReports();

      expect(reportService.generatePdfReport).not.toHaveBeenCalled();
      expect(queueService.addEmailJob).not.toHaveBeenCalled();
    });

    it('should skip when already processing', async () => {
      prisma.userPreferences.findMany.mockResolvedValue([mockPrefsWeekly] as any);
      reportService.generatePdfReport.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(Buffer.from('pdf')), 100))
      );
      queueService.addEmailJob.mockResolvedValue(null);

      // Start first run
      const firstRun = processor.processWeeklyReports();
      // Immediately try second run (should skip)
      const secondRun = processor.processWeeklyReports();

      await Promise.all([firstRun, secondRun]);

      // Only one call because second run was skipped
      expect(prisma.userPreferences.findMany).toHaveBeenCalledTimes(1);
    });

    it('should handle errors for individual users without stopping the batch', async () => {
      const user2 = {
        ...mockUser,
        id: 'user-456',
        email: 'user2@example.com',
        userSpaces: [{ spaceId: 'space-2', space: { name: 'Business Space' } }],
      };
      const prefs2 = { ...mockPrefsWeekly, user: user2 };

      prisma.userPreferences.findMany.mockResolvedValue([mockPrefsWeekly, prefs2] as any);

      // First user fails, second succeeds
      reportService.generatePdfReport
        .mockRejectedValueOnce(new Error('Report generation failed'))
        .mockResolvedValueOnce(Buffer.from('pdf-content'));
      queueService.addEmailJob.mockResolvedValue(null);

      await processor.processWeeklyReports();

      // Should still process second user despite first user failing
      expect(reportService.generatePdfReport).toHaveBeenCalledTimes(2);
      expect(queueService.addEmailJob).toHaveBeenCalledTimes(1);
    });

    it('should handle empty user list', async () => {
      prisma.userPreferences.findMany.mockResolvedValue([]);

      await processor.processWeeklyReports();

      expect(reportService.generatePdfReport).not.toHaveBeenCalled();
      expect(queueService.addEmailJob).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      prisma.userPreferences.findMany.mockRejectedValue(new Error('Database error'));

      await expect(processor.processWeeklyReports()).resolves.not.toThrow();
    });

    it('should generate CSV report when export format is csv', async () => {
      const csvPrefs = { ...mockPrefsWeekly, exportFormat: 'csv' };
      prisma.userPreferences.findMany.mockResolvedValue([csvPrefs] as any);
      reportService.generateCsvExport.mockResolvedValue('Date,Amount\n2026-01-01,100');
      queueService.addEmailJob.mockResolvedValue(null);

      await processor.processWeeklyReports();

      expect(reportService.generateCsvExport).toHaveBeenCalledWith(
        'space-1',
        expect.any(Date),
        expect.any(Date)
      );
      expect(queueService.addEmailJob).toHaveBeenCalledWith({
        to: 'user@example.com',
        template: 'scheduled-weekly-report',
        data: expect.objectContaining({
          attachment: expect.objectContaining({
            contentType: 'text/csv',
            filename: expect.stringContaining('.csv'),
          }),
        }),
      });
    });

    it('should generate Excel report when export format is excel', async () => {
      const excelPrefs = { ...mockPrefsWeekly, exportFormat: 'excel' };
      prisma.userPreferences.findMany.mockResolvedValue([excelPrefs] as any);
      reportService.generateExcelExport.mockResolvedValue(Buffer.from('excel-content'));
      queueService.addEmailJob.mockResolvedValue(null);

      await processor.processWeeklyReports();

      expect(reportService.generateExcelExport).toHaveBeenCalledWith(
        'space-1',
        expect.any(Date),
        expect.any(Date)
      );
      expect(queueService.addEmailJob).toHaveBeenCalledWith({
        to: 'user@example.com',
        template: 'scheduled-weekly-report',
        data: expect.objectContaining({
          attachment: expect.objectContaining({
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            filename: expect.stringContaining('.xlsx'),
          }),
        }),
      });
    });
  });

  describe('processMonthlyReports', () => {
    it('should generate monthly reports for active users with monthly reports enabled', async () => {
      prisma.userPreferences.findMany.mockResolvedValue([mockPrefsMonthly] as any);
      reportService.generateCsvExport.mockResolvedValue('Date,Amount\n2026-01-01,100');
      queueService.addEmailJob.mockResolvedValue(null);

      await processor.processMonthlyReports();

      expect(prisma.userPreferences.findMany).toHaveBeenCalledWith({
        where: { monthlyReports: true },
        include: {
          user: {
            include: {
              userSpaces: {
                include: {
                  space: true,
                },
              },
            },
          },
        },
      });
      expect(reportService.generateCsvExport).toHaveBeenCalledWith(
        'space-1',
        expect.any(Date),
        expect.any(Date)
      );
      expect(queueService.addEmailJob).toHaveBeenCalledWith({
        to: 'user@example.com',
        template: 'scheduled-monthly-report',
        data: expect.objectContaining({
          spaceName: 'Personal Space',
          reportType: 'monthly',
          attachment: expect.objectContaining({
            contentType: 'text/csv',
          }),
        }),
      });
    });

    it('should skip inactive users', async () => {
      const inactivePrefs = {
        ...mockPrefsMonthly,
        user: { ...mockUser, isActive: false },
      };
      prisma.userPreferences.findMany.mockResolvedValue([inactivePrefs] as any);

      await processor.processMonthlyReports();

      expect(reportService.generateCsvExport).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      prisma.userPreferences.findMany.mockRejectedValue(new Error('Database error'));

      await expect(processor.processMonthlyReports()).resolves.not.toThrow();
    });
  });

  describe('triggerReport', () => {
    it('should generate and send a report on demand', async () => {
      prisma.space.findUnique.mockResolvedValue({ id: 'space-1', name: 'Test Space' } as any);
      reportService.generatePdfReport.mockResolvedValue(Buffer.from('pdf-content'));
      queueService.addEmailJob.mockResolvedValue(null);

      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-31');

      await processor.triggerReport(
        'space-1',
        'user-123',
        'user@example.com',
        'pdf',
        startDate,
        endDate
      );

      expect(prisma.space.findUnique).toHaveBeenCalledWith({ where: { id: 'space-1' } });
      expect(reportService.generatePdfReport).toHaveBeenCalledWith('space-1', startDate, endDate);
      expect(queueService.addEmailJob).toHaveBeenCalledWith({
        to: 'user@example.com',
        template: 'scheduled-monthly-report',
        data: expect.objectContaining({
          spaceName: 'Test Space',
          reportType: 'monthly',
          attachment: expect.objectContaining({
            contentType: 'application/pdf',
          }),
        }),
      });
    });

    it('should throw when space is not found', async () => {
      prisma.space.findUnique.mockResolvedValue(null);

      await expect(
        processor.triggerReport(
          'nonexistent',
          'user-123',
          'user@example.com',
          'pdf',
          new Date(),
          new Date()
        )
      ).rejects.toThrow('Space not found');
    });

    it('should support excel format on demand', async () => {
      prisma.space.findUnique.mockResolvedValue({ id: 'space-1', name: 'Test Space' } as any);
      reportService.generateExcelExport.mockResolvedValue(Buffer.from('excel-content'));
      queueService.addEmailJob.mockResolvedValue(null);

      await processor.triggerReport(
        'space-1',
        'user-123',
        'user@example.com',
        'excel',
        new Date('2026-01-01'),
        new Date('2026-01-31')
      );

      expect(reportService.generateExcelExport).toHaveBeenCalled();
      expect(queueService.addEmailJob).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            attachment: expect.objectContaining({
              contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            }),
          }),
        })
      );
    });

    it('should support csv format on demand', async () => {
      prisma.space.findUnique.mockResolvedValue({ id: 'space-1', name: 'Test Space' } as any);
      reportService.generateCsvExport.mockResolvedValue('csv-content');
      queueService.addEmailJob.mockResolvedValue(null);

      await processor.triggerReport(
        'space-1',
        'user-123',
        'user@example.com',
        'csv',
        new Date('2026-01-01'),
        new Date('2026-01-31')
      );

      expect(reportService.generateCsvExport).toHaveBeenCalled();
      expect(queueService.addEmailJob).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            attachment: expect.objectContaining({
              contentType: 'text/csv',
            }),
          }),
        })
      );
    });
  });
});
