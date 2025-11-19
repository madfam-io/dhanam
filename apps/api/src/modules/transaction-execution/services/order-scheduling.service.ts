import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  addDays,
  addMonths,
  addWeeks,
  isBefore,
  isAfter,
  setDate,
  setDay,
  startOfDay,
} from 'date-fns';

import { PrismaService } from '../../../core/prisma/prisma.service';
import { TransactionExecutionService } from '../transaction-execution.service';

@Injectable()
export class OrderSchedulingService {
  private readonly logger = new Logger(OrderSchedulingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionExecution: TransactionExecutionService
  ) {}

  /**
   * Check for scheduled orders every hour
   */
  @Cron('0 * * * *') // Every hour
  async processScheduledOrders() {
    this.logger.log('Processing scheduled orders');

    try {
      const now = new Date();

      // Get orders scheduled for execution
      const orders = await this.prisma.transactionOrder.findMany({
        where: {
          status: 'pending_execution',
          OR: [
            {
              // One-time scheduled orders
              scheduledFor: {
                lte: now,
              },
              recurrence: 'once',
            },
            {
              // Recurring orders due for execution
              nextExecutionAt: {
                lte: now,
              },
              recurrence: {
                not: 'once',
              },
            },
          ],
        },
        include: {
          account: true,
        },
        orderBy: {
          priority: 'desc',
        },
      });

      if (orders.length === 0) {
        this.logger.debug('No scheduled orders due for execution');
        return;
      }

      this.logger.log(`Found ${orders.length} orders to execute`);

      for (const order of orders) {
        await this.executeScheduledOrder(order);
      }

      this.logger.log('Scheduled order processing completed');
    } catch (error) {
      this.logger.error('Error processing scheduled orders', error);
    }
  }

  /**
   * Execute a scheduled order
   */
  private async executeScheduledOrder(order: any): Promise<void> {
    try {
      this.logger.log(`Executing scheduled order ${order.id}`);

      // Execute the order
      await this.transactionExecution.executeOrder(order.spaceId, order.userId, order.id);

      // Handle recurrence
      if (order.recurrence && order.recurrence !== 'once') {
        await this.scheduleNextExecution(order);
      } else {
        this.logger.log(`One-time scheduled order ${order.id} completed`);
      }
    } catch (error) {
      this.logger.error(`Failed to execute scheduled order ${order.id}`, error);

      // Update order status
      await this.prisma.transactionOrder.update({
        where: { id: order.id },
        data: {
          status: 'failed',
          errorCode: 'SCHEDULED_EXECUTION_FAILED',
          errorMessage: error.message,
        },
      });
    }
  }

  /**
   * Schedule next execution for recurring order
   */
  private async scheduleNextExecution(order: any): Promise<void> {
    const executionCount = (order.executionCount || 0) + 1;

    // Check if max executions reached
    if (order.maxExecutions && executionCount >= order.maxExecutions) {
      this.logger.log(`Order ${order.id} reached max executions (${order.maxExecutions})`);
      await this.prisma.transactionOrder.update({
        where: { id: order.id },
        data: {
          status: 'completed',
          executionCount,
        },
      });
      return;
    }

    // Calculate next execution time
    const nextExecutionAt = this.calculateNextExecution(order);

    // Check if past recurrence end date
    if (order.recurrenceEnd && isAfter(nextExecutionAt, order.recurrenceEnd)) {
      this.logger.log(`Order ${order.id} past recurrence end date`);
      await this.prisma.transactionOrder.update({
        where: { id: order.id },
        data: {
          status: 'completed',
          executionCount,
        },
      });
      return;
    }

    // Schedule next execution
    await this.prisma.transactionOrder.update({
      where: { id: order.id },
      data: {
        status: 'pending_execution',
        nextExecutionAt,
        executionCount,
      },
    });

    this.logger.log(`Scheduled next execution for order ${order.id} at ${nextExecutionAt}`);
  }

  /**
   * Calculate next execution time based on recurrence pattern
   */
  private calculateNextExecution(order: any): Date {
    const now = new Date();

    switch (order.recurrence) {
      case 'daily':
        return addDays(now, 1);

      case 'weekly':
        return this.getNextWeeklyExecution(now, order.recurrenceDay);

      case 'monthly':
        return this.getNextMonthlyExecution(now, order.recurrenceDay);

      case 'quarterly':
        return addMonths(now, 3);

      default:
        throw new Error(`Unknown recurrence pattern: ${order.recurrence}`);
    }
  }

  /**
   * Get next weekly execution time
   */
  private getNextWeeklyExecution(now: Date, dayOfWeek?: number): Date {
    if (!dayOfWeek || dayOfWeek < 1 || dayOfWeek > 7) {
      // Default to same day next week
      return addWeeks(now, 1);
    }

    // Set to specified day of week
    let next = setDay(now, dayOfWeek, { weekStartsOn: 1 });

    // If that day has passed this week, move to next week
    if (isBefore(next, now)) {
      next = addWeeks(next, 1);
    }

    return next;
  }

  /**
   * Get next monthly execution time
   */
  private getNextMonthlyExecution(now: Date, dayOfMonth?: number): Date {
    if (!dayOfMonth || dayOfMonth < 1 || dayOfMonth > 31) {
      // Default to same day next month
      return addMonths(now, 1);
    }

    // Set to specified day of month
    let next = setDate(now, Math.min(dayOfMonth, 28)); // Cap at 28 for safety

    // If that day has passed this month, move to next month
    if (isBefore(next, now)) {
      next = addMonths(next, 1);
    }

    return startOfDay(next);
  }

  /**
   * Create a recurring order (DCA strategy)
   */
  async createRecurringOrder(
    spaceId: string,
    userId: string,
    orderData: any,
    recurrenceConfig: {
      pattern: string;
      day?: number;
      endDate?: Date;
      maxExecutions?: number;
    }
  ): Promise<any> {
    // Calculate first execution time
    const firstExecution = this.calculateNextExecution({
      recurrence: recurrenceConfig.pattern,
      recurrenceDay: recurrenceConfig.day,
    });

    // Create the order with recurrence settings
    const order = await this.transactionExecution.createOrder(spaceId, userId, {
      ...orderData,
      scheduledFor: firstExecution,
      recurrence: recurrenceConfig.pattern,
      recurrenceDay: recurrenceConfig.day,
      recurrenceEnd: recurrenceConfig.endDate,
      maxExecutions: recurrenceConfig.maxExecutions,
      nextExecutionAt: firstExecution,
    });

    this.logger.log(
      `Created recurring ${recurrenceConfig.pattern} order ${order.id}, first execution at ${firstExecution}`
    );

    return order;
  }

  /**
   * Cancel all future executions of a recurring order
   */
  async cancelRecurring(orderId: string): Promise<void> {
    await this.prisma.transactionOrder.update({
      where: { id: orderId },
      data: {
        status: 'cancelled',
        recurrenceEnd: new Date(), // Set end date to now
      },
    });

    this.logger.log(`Cancelled recurring order ${orderId}`);
  }
}
