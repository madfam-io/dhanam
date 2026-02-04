import { Controller, Get, Delete, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { AuditService } from '@core/audit/audit.service';
import { CurrentUser, AuthenticatedUser } from '@core/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { PrismaService } from '@core/prisma/prisma.service';

@ApiTags('GDPR')
@Controller('users/me')
@UseGuards(JwtAuthGuard)
export class GdprController {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService
  ) {}

  @Get('export')
  @ApiOperation({ summary: 'Export all user data (GDPR)' })
  @ApiResponse({ status: 200, description: 'User data archive' })
  async exportUserData(@CurrentUser() user: AuthenticatedUser) {
    const userId = user.userId;

    const [userData, spaces, accounts, transactions, auditLogs, preferences] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          locale: true,
          timezone: true,
          createdAt: true,
          updatedAt: true,
          emailVerified: true,
          onboardingCompleted: true,
          subscriptionTier: true,
        },
      }),
      this.prisma.userSpace.findMany({
        where: { userId },
        include: { space: true },
      }),
      this.prisma.account.findMany({
        where: { space: { userSpaces: { some: { userId } } } },
        select: {
          id: true,
          name: true,
          type: true,
          provider: true,
          currency: true,
          balance: true,
          createdAt: true,
        },
      }),
      this.prisma.transaction.findMany({
        where: { account: { space: { userSpaces: { some: { userId } } } } },
        select: {
          id: true,
          amount: true,
          currency: true,
          description: true,
          merchant: true,
          date: true,
          createdAt: true,
        },
        take: 10000, // Limit for performance
      }),
      this.auditService.exportUserAuditLogs(userId),
      this.prisma.userPreferences.findUnique({ where: { userId } }),
    ]);

    await this.auditService.logEvent({
      action: 'GDPR_DATA_EXPORT',
      resource: 'user',
      resourceId: userId,
      userId,
      severity: 'high',
    });

    return {
      exportedAt: new Date().toISOString(),
      user: userData,
      spaces: spaces.map((us) => ({
        id: us.space.id,
        name: us.space.name,
        type: us.space.type,
        role: us.role,
      })),
      accounts,
      transactions,
      auditLogs,
      preferences,
    };
  }

  @Delete('erasure')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Request account deletion (GDPR right to erasure)' })
  @ApiResponse({ status: 202, description: 'Deletion scheduled (30-day waiting period)' })
  async requestDeletion(@CurrentUser() user: AuthenticatedUser) {
    const userId = user.userId;

    // Soft delete: set deletedAt, account will be purged after 30 days
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    await this.auditService.logEvent({
      action: 'GDPR_DELETION_REQUESTED',
      resource: 'user',
      resourceId: userId,
      userId,
      severity: 'critical',
    });

    return {
      message:
        'Account deletion scheduled. Your account will be permanently deleted after 30 days. Contact support to cancel.',
      deletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }
}
