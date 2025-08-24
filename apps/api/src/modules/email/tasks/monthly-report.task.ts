import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '@core/prisma/prisma.service';
import { EmailService } from '../email.service';
import { AnalyticsService } from '@modules/analytics/analytics.service';
import { ReportService } from '@modules/analytics/report.service';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { Currency } from '@prisma/client';

@Injectable()
export class MonthlyReportTask {
  private readonly logger = new Logger(MonthlyReportTask.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly analyticsService: AnalyticsService,
    private readonly reportService: ReportService,
  ) {}

  // Run on the 1st of each month at 10 AM
  @Cron('0 10 1 * *')
  async sendMonthlyReports() {
    this.logger.log('Starting monthly report email task');

    try {
      // Get all active users with monthly reports enabled
      const users = await this.prisma.user.findMany({
        where: {
          isActive: true,
          monthlyReports: true,
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

      const lastMonth = subMonths(new Date(), 1);
      const monthStart = startOfMonth(lastMonth);
      const monthEnd = endOfMonth(lastMonth);

      for (const user of users) {
        try {
          for (const userSpace of user.userSpaces) {
            const reportData = await this.generateMonthlyReport(
              userSpace.space.id,
              userSpace.userId,
              monthStart,
              monthEnd,
              userSpace.space.currency,
            );

            if (reportData.hasActivity) {
              // Generate PDF report
              const pdfBuffer = await this.reportService.generatePdfReport(
                userSpace.space.id,
                monthStart,
                monthEnd,
              );

              await this.emailService.sendMonthlyReportEmail(
                user.email,
                user.name,
                reportData,
                pdfBuffer,
              );

              this.logger.log(`Sent monthly report to ${user.email}`);
            }
          }
        } catch (error) {
          this.logger.error(`Failed to send report to ${user.email}:`, error);
        }
      }

      this.logger.log('Monthly report email task completed');
    } catch (error) {
      this.logger.error('Monthly report task failed:', error);
    }
  }

  private async generateMonthlyReport(
    spaceId: string,
    userId: string,
    startDate: Date,
    endDate: Date,
    currency: Currency,
  ) {
    // Get income and expenses
    const cashflow = await this.analyticsService.getCashFlow(
      spaceId,
      startDate,
      endDate,
    );

    const totalIncome = cashflow.income.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = Math.abs(cashflow.expenses.reduce((sum, item) => sum + item.amount, 0));
    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    // Get budget performance
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

    const budgetPerformance = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await this.analyticsService.getBudgetSpending(
          budget.id,
          startDate,
          endDate,
        );

        const categories = budget.budgetCategories.map(bc => ({
          category: bc.category.name,
          budgeted: bc.amount.toNumber(),
          actual: spent.byCategory[bc.categoryId] || 0,
          variance: bc.amount.toNumber() - (spent.byCategory[bc.categoryId] || 0),
        }));

        return categories;
      }),
    );

    // Get net worth trend
    const netWorthData = await this.getNetWorthTrend(spaceId, startDate, endDate);

    // Get ESG data for crypto holdings
    const esgData = await this.getEsgData(spaceId);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      savingsRate,
      budgetPerformance.flat(),
      netWorthData,
    );

    return {
      hasActivity: totalIncome > 0 || totalExpenses > 0,
      month: format(startDate, 'MMMM'),
      monthNumber: format(startDate, 'MM'),
      year: format(startDate, 'yyyy'),
      currency,
      totalIncome: totalIncome.toFixed(2),
      totalExpenses: totalExpenses.toFixed(2),
      netSavings: netSavings.toFixed(2),
      savingsRate: savingsRate.toFixed(1),
      budgetPerformance: budgetPerformance.flat(),
      netWorthTrend: netWorthData.trend,
      currentNetWorth: netWorthData.current.toFixed(2),
      netWorthChange: netWorthData.change.toFixed(2),
      netWorthChangePercent: netWorthData.changePercent.toFixed(1),
      esgData,
      recommendations,
      hasAttachment: true,
    };
  }

  private async getNetWorthTrend(spaceId: string, startDate: Date, endDate: Date) {
    const startValuation = await this.prisma.assetValuation.findFirst({
      where: {
        account: {
          spaceId,
        },
        date: {
          gte: startDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    const endValuation = await this.prisma.assetValuation.findFirst({
      where: {
        account: {
          spaceId,
        },
        date: {
          lte: endDate,
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    const startValue = startValuation?.value.toNumber() || 0;
    const endValue = endValuation?.value.toNumber() || 0;
    const change = endValue - startValue;
    const changePercent = startValue > 0 ? (change / startValue) * 100 : 0;

    return {
      trend: change >= 0 ? 'increased' : 'decreased',
      current: endValue,
      change,
      changePercent,
    };
  }

  private async getEsgData(spaceId: string) {
    const cryptoAccounts = await this.prisma.account.findMany({
      where: {
        spaceId,
        provider: 'bitso',
        type: 'crypto',
      },
      include: {
        esgScores: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (cryptoAccounts.length === 0) {
      return null;
    }

    const avgScore = cryptoAccounts.reduce((sum, acc) => {
      const score = acc.esgScores[0]?.compositeScore || 0;
      return sum + score;
    }, 0) / cryptoAccounts.length;

    let insight = '';
    if (avgScore >= 80) {
      insight = 'Your crypto portfolio has an excellent ESG score!';
    } else if (avgScore >= 60) {
      insight = 'Your crypto portfolio has a good ESG score with room for improvement.';
    } else {
      insight = 'Consider diversifying into more environmentally friendly crypto assets.';
    }

    return {
      score: Math.round(avgScore),
      insight,
    };
  }

  private generateRecommendations(
    savingsRate: number,
    budgetPerformance: any[],
    netWorthData: any,
  ): string[] {
    const recommendations: string[] = [];

    // Savings rate recommendation
    if (savingsRate < 10) {
      recommendations.push('Aim to save at least 10-20% of your income for financial security.');
    } else if (savingsRate >= 30) {
      recommendations.push('Excellent savings rate! Consider investing surplus funds for growth.');
    }

    // Budget performance
    const overBudgetCategories = budgetPerformance.filter(b => b.variance < 0);
    if (overBudgetCategories.length > 0) {
      const topOverspend = overBudgetCategories
        .sort((a, b) => a.variance - b.variance)[0];
      recommendations.push(
        `Review spending in ${topOverspend.category} which exceeded budget by ${Math.abs(topOverspend.variance).toFixed(2)}.`
      );
    }

    // Net worth trend
    if (netWorthData.changePercent < -5) {
      recommendations.push('Your net worth declined significantly. Review investment performance and spending habits.');
    } else if (netWorthData.changePercent > 10) {
      recommendations.push('Strong net worth growth! Ensure proper diversification across asset classes.');
    }

    // General recommendations
    const underutilizedBudgets = budgetPerformance.filter(b => b.variance > b.budgeted * 0.5);
    if (underutilizedBudgets.length > 0) {
      recommendations.push('Some budget categories are significantly underutilized. Consider reallocating funds.');
    }

    return recommendations.slice(0, 5); // Limit to 5 recommendations
  }
}