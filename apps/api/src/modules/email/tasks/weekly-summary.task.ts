import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@core/prisma/prisma.service';
import { EmailService } from '../email.service';
import { AnalyticsService } from '@modules/analytics/analytics.service';
import { startOfWeek, endOfWeek, subWeeks, format } from 'date-fns';
import { Currency } from '@prisma/client';

@Injectable()
export class WeeklySummaryTask {
  private readonly logger = new Logger(WeeklySummaryTask.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  // Run every Monday at 9 AM
  @Cron('0 9 * * 1')
  async sendWeeklySummaries() {
    this.logger.log('Starting weekly summary email task');

    try {
      // Get all active users with email notifications enabled
      const users = await this.prisma.user.findMany({
        where: {
          isActive: true,
          emailNotifications: true,
        },
        include: {
          userSpaces: {
            where: {
              role: 'owner',
            },
            include: {
              space: true,
            },
          },
        },
      });

      const lastWeekStart = startOfWeek(subWeeks(new Date(), 1));
      const lastWeekEnd = endOfWeek(subWeeks(new Date(), 1));

      for (const user of users) {
        try {
          // Process each user's primary space
          for (const userSpace of user.userSpaces) {
            const summaryData = await this.generateWeeklySummary(
              userSpace.space.id,
              lastWeekStart,
              lastWeekEnd,
              userSpace.space.currency,
            );

            if (summaryData.hasActivity) {
              await this.emailService.sendWeeklySummaryEmail(
                user.email,
                user.name,
                summaryData,
              );

              this.logger.log(`Sent weekly summary to ${user.email}`);
            }
          }
        } catch (error) {
          this.logger.error(`Failed to send summary to ${user.email}:`, error);
        }
      }

      this.logger.log('Weekly summary email task completed');
    } catch (error) {
      this.logger.error('Weekly summary task failed:', error);
    }
  }

  private async generateWeeklySummary(
    spaceId: string,
    startDate: Date,
    endDate: Date,
    currency: Currency,
  ) {
    // Get spending summary
    const spending = await this.analyticsService.getSpendingByCategory(
      spaceId,
      startDate,
      endDate,
    );

    // Get total spent
    const totalSpent = spending.reduce((sum, cat) => sum + cat.total, 0);

    // Get income
    const income = await this.prisma.transaction.aggregate({
      where: {
        spaceId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        amount: {
          gt: 0,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const totalIncome = income._sum.amount?.toNumber() || 0;
    const netChange = totalIncome - totalSpent;

    // Get budget status
    const budgets = await this.prisma.budget.findMany({
      where: {
        spaceId,
        isActive: true,
      },
      include: {
        budgetCategories: {
          include: {
            category: true,
          },
        },
      },
    });

    const budgetStatus = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await this.analyticsService.getBudgetSpending(
          budget.id,
          startDate,
          endDate,
        );

        return {
          name: budget.name,
          limit: budget.amount.toNumber(),
          spent: spent.totalSpent,
          percentage: Math.round((spent.totalSpent / budget.amount.toNumber()) * 100),
        };
      }),
    );

    // Generate insights
    const insights = this.generateInsights(
      totalSpent,
      totalIncome,
      netChange,
      spending,
      budgetStatus,
    );

    return {
      hasActivity: totalSpent > 0 || totalIncome > 0,
      weekStart: format(startDate, 'MMM d'),
      weekEnd: format(endDate, 'MMM d, yyyy'),
      currency,
      totalSpent: totalSpent.toFixed(2),
      totalIncome: totalIncome.toFixed(2),
      netChange: netChange.toFixed(2),
      topCategories: spending
        .sort((a, b) => b.total - a.total)
        .slice(0, 5)
        .map(cat => ({
          name: cat.categoryName,
          amount: cat.total.toFixed(2),
          percentage: Math.round((cat.total / totalSpent) * 100),
          color: this.getCategoryColor(cat.categoryName),
        })),
      budgets: budgetStatus,
      insights,
    };
  }

  private generateInsights(
    totalSpent: number,
    totalIncome: number,
    netChange: number,
    spending: any[],
    budgets: any[],
  ): string[] {
    const insights: string[] = [];

    // Net change insight
    if (netChange > 0) {
      insights.push(`Great job! You saved ${Math.abs(netChange).toFixed(2)} this week.`);
    } else if (netChange < 0) {
      insights.push(`You spent ${Math.abs(netChange).toFixed(2)} more than you earned this week.`);
    }

    // Budget alerts
    const overBudget = budgets.filter(b => b.percentage > 90);
    if (overBudget.length > 0) {
      insights.push(
        `${overBudget.length} budget${overBudget.length > 1 ? 's are' : ' is'} over 90% utilized.`
      );
    }

    // Top spending category
    if (spending.length > 0) {
      const topCategory = spending[0];
      insights.push(
        `Your highest spending was on ${topCategory.categoryName} (${topCategory.percentage}% of total).`
      );
    }

    // Savings rate
    if (totalIncome > 0) {
      const savingsRate = ((totalIncome - totalSpent) / totalIncome) * 100;
      if (savingsRate > 20) {
        insights.push(`Excellent savings rate of ${savingsRate.toFixed(1)}%!`);
      } else if (savingsRate > 0) {
        insights.push(`Consider increasing your savings rate from ${savingsRate.toFixed(1)}%.`);
      }
    }

    return insights;
  }

  private getCategoryColor(categoryName: string): string {
    const colors: Record<string, string> = {
      'Food & Dining': '#FF6B6B',
      'Transportation': '#4ECDC4',
      'Shopping': '#45B7D1',
      'Entertainment': '#96CEB4',
      'Bills & Utilities': '#DDA0DD',
      'Healthcare': '#98D8C8',
      'Education': '#F7DC6F',
      'Other': '#95A5A6',
    };

    return colors[categoryName] || '#95A5A6';
  }
}