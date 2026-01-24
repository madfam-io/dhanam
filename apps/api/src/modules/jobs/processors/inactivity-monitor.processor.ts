import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { PrismaService } from '@core/prisma/prisma.service';

import { QueueService } from '../queue.service';

interface InactiveUser {
  id: string;
  email: string;
  name: string;
  lastActivityAt: Date | null;
  lastLoginAt: Date | null;
  lifeBeatAlertDays: number[];
  daysSinceActivity: number;
  executorAssignments: Array<{
    id: string;
    executorEmail: string;
    executorName: string;
    priority: number;
    verified: boolean;
  }>;
}

/**
 * Scheduled processor that monitors user inactivity
 * and sends escalating alerts based on Life Beat configuration
 */
@Injectable()
export class InactivityMonitorProcessor implements OnModuleInit {
  private readonly logger = new Logger(InactivityMonitorProcessor.name);
  private isProcessing = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService
  ) {}

  async onModuleInit() {
    this.logger.log('Inactivity Monitor Processor initialized');
  }

  /**
   * Run inactivity check daily at 9 AM
   */
  @Cron('0 9 * * *')
  async checkInactiveUsers() {
    if (this.isProcessing) {
      this.logger.warn('Skipping inactivity check - previous job still running');
      return;
    }

    this.isProcessing = true;
    const startTime = Date.now();

    try {
      this.logger.log('Starting daily inactivity check...');

      // Get all users with Life Beat enabled
      const lifeBeatUsers = await this.getLifeBeatUsers();
      this.logger.log(`Checking ${lifeBeatUsers.length} users with Life Beat enabled`);

      let alertsSent = 0;
      let executorNotifications = 0;

      for (const user of lifeBeatUsers) {
        const result = await this.processUserInactivity(user);
        alertsSent += result.alertsSent;
        executorNotifications += result.executorNotifications;
      }

      const duration = (Date.now() - startTime) / 1000;
      this.logger.log(
        `Inactivity check complete: ${alertsSent} alerts sent, ` +
          `${executorNotifications} executor notifications in ${duration.toFixed(2)}s`
      );
    } catch (error) {
      this.logger.error('Error during inactivity check:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get all users with Life Beat enabled
   */
  private async getLifeBeatUsers(): Promise<InactiveUser[]> {
    const users = await this.prisma.user.findMany({
      where: {
        lifeBeatEnabled: true,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        lastActivityAt: true,
        lastLoginAt: true,
        lifeBeatAlertDays: true,
        executorAssignments: {
          select: {
            id: true,
            executorEmail: true,
            executorName: true,
            priority: true,
            verified: true,
          },
          orderBy: { priority: 'asc' },
        },
      },
    });

    return users.map((user) => {
      const lastActivity = this.getEffectiveLastActivity(user.lastActivityAt, user.lastLoginAt);
      const daysSinceActivity = lastActivity
        ? Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
        : 999; // Treat never-active as very inactive

      return {
        ...user,
        daysSinceActivity,
      };
    });
  }

  /**
   * Process inactivity for a single user
   */
  private async processUserInactivity(
    user: InactiveUser
  ): Promise<{ alertsSent: number; executorNotifications: number }> {
    let alertsSent = 0;
    let executorNotifications = 0;

    // Check each alert threshold
    for (const alertDays of user.lifeBeatAlertDays) {
      if (user.daysSinceActivity >= alertDays) {
        const alertSent = await this.checkAndSendAlert(user, alertDays);
        if (alertSent) {
          alertsSent++;

          // If this is the final threshold (usually 90 days), notify executors
          if (alertDays === Math.max(...user.lifeBeatAlertDays)) {
            const notified = await this.notifyExecutors(user);
            executorNotifications += notified;
          }
        }
      }
    }

    return { alertsSent, executorNotifications };
  }

  /**
   * Check if we should send an alert and send it
   */
  private async checkAndSendAlert(user: InactiveUser, alertDays: number): Promise<boolean> {
    // Check if we've already sent this alert level recently (within last 7 days)
    const recentAlert = await this.prisma.inactivityAlert.findFirst({
      where: {
        userId: user.id,
        alertLevel: alertDays,
        sentAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });

    if (recentAlert) {
      return false; // Already sent recently
    }

    // Create alert record
    await this.prisma.inactivityAlert.create({
      data: {
        userId: user.id,
        alertLevel: alertDays,
        channel: 'email',
      },
    });

    // Send email alert
    await this.sendInactivityWarning(user, alertDays);

    this.logger.log(`Sent ${alertDays}-day inactivity alert to user ${user.id}`);
    return true;
  }

  /**
   * Send inactivity warning email to user
   */
  private async sendInactivityWarning(user: InactiveUser, alertDays: number): Promise<void> {
    const isWarning = alertDays < Math.max(...user.lifeBeatAlertDays);

    await this.queueService.addEmailJob({
      to: user.email,
      template: 'life-beat-inactivity-warning',
      data: {
        name: user.name,
        daysInactive: user.daysSinceActivity,
        alertLevel: alertDays,
        isWarning,
        isFinal: !isWarning,
        executorCount: user.executorAssignments.filter((e) => e.verified).length,
        checkInUrl: 'https://app.dhan.am/life-beat/check-in',
        settingsUrl: 'https://app.dhan.am/settings/life-beat',
      },
    });
  }

  /**
   * Notify designated executors when final threshold is reached
   */
  private async notifyExecutors(user: InactiveUser): Promise<number> {
    const verifiedExecutors = user.executorAssignments.filter((e) => e.verified);

    if (verifiedExecutors.length === 0) {
      this.logger.warn(`User ${user.id} has no verified executors for final alert`);
      return 0;
    }

    let notified = 0;

    for (const executor of verifiedExecutors) {
      // Check if we've already notified this executor recently
      const recentNotification = await this.prisma.userNotification.findFirst({
        where: {
          userId: user.id,
          type: 'executor_inactivity_alert',
          metadata: {
            path: ['executorEmail'],
            equals: executor.executorEmail,
          },
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      });

      if (recentNotification) {
        continue;
      }

      // Send email to executor
      await this.queueService.addEmailJob({
        to: executor.executorEmail,
        template: 'life-beat-executor-alert',
        data: {
          executorName: executor.executorName,
          accountHolderName: user.name,
          daysInactive: user.daysSinceActivity,
          accessRequestUrl: `https://app.dhan.am/executor-access/${executor.id}`,
          relationship: 'designated executor',
        },
      });

      // Record notification
      await this.prisma.userNotification.create({
        data: {
          userId: user.id,
          type: 'executor_inactivity_alert',
          title: 'Executor Notified',
          message: `${executor.executorName} has been notified of your extended inactivity`,
          metadata: {
            executorEmail: executor.executorEmail,
            executorName: executor.executorName,
            daysInactive: user.daysSinceActivity,
          },
        },
      });

      notified++;
      this.logger.log(`Notified executor ${executor.executorEmail} for user ${user.id}`);
    }

    return notified;
  }

  /**
   * Get the most recent activity timestamp
   */
  private getEffectiveLastActivity(
    lastActivityAt: Date | null,
    lastLoginAt: Date | null
  ): Date | null {
    if (!lastActivityAt && !lastLoginAt) {
      return null;
    }

    if (!lastActivityAt) return lastLoginAt;
    if (!lastLoginAt) return lastActivityAt;

    return lastActivityAt > lastLoginAt ? lastActivityAt : lastLoginAt;
  }

  /**
   * Manual trigger for testing or admin use
   */
  async triggerInactivityCheck(userId?: string): Promise<void> {
    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          lastActivityAt: true,
          lastLoginAt: true,
          lifeBeatAlertDays: true,
          executorAssignments: {
            select: {
              id: true,
              executorEmail: true,
              executorName: true,
              priority: true,
              verified: true,
            },
            orderBy: { priority: 'asc' },
          },
        },
      });

      if (user) {
        const lastActivity = this.getEffectiveLastActivity(user.lastActivityAt, user.lastLoginAt);
        const daysSinceActivity = lastActivity
          ? Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        const result = await this.processUserInactivity({
          ...user,
          daysSinceActivity,
        });
        this.logger.log(
          `Manual inactivity check for user ${userId}: ` +
            `${result.alertsSent} alerts, ${result.executorNotifications} executor notifications`
        );
      }
    } else {
      await this.checkInactiveUsers();
    }
  }
}
