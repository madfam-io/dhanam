import { Injectable } from '@nestjs/common';
import { format } from 'date-fns';
import PDFDocument from 'pdfkit';

import { PrismaService } from '@core/prisma/prisma.service';

import { AnalyticsService } from './analytics.service';

@Injectable()
export class ReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analyticsService: AnalyticsService
  ) {}

  async generatePdfReport(spaceId: string, startDate: Date, endDate: Date): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument();
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      (async () => {
        try {
          // Get space details
          const space = await this.prisma.space.findUnique({
            where: { id: spaceId },
            include: {
              userSpaces: {
                include: {
                  user: true,
                },
              },
            },
          });

          if (!space) {
            throw new Error('Space not found');
          }

          // Title Page
          doc.fontSize(24).text('Dhanam Financial Report', 50, 50);
          doc.fontSize(18).text(space.name, 50, 90);
          doc
            .fontSize(14)
            .text(
              `${format(startDate, 'MMMM d, yyyy')} - ${format(endDate, 'MMMM d, yyyy')}`,
              50,
              120
            );

          // Executive Summary
          doc.addPage();
          doc.fontSize(20).text('Executive Summary', 50, 50);

          // Get income and expense data
          const transactions = await this.prisma.transaction.findMany({
            where: {
              account: { spaceId },
              date: {
                gte: startDate,
                lte: endDate,
              },
            },
            include: {
              category: true,
            },
          });

          const incomeTransactions = transactions.filter((t) => t.amount.gt(0));
          const expenseTransactions = transactions.filter((t) => t.amount.lt(0));

          const cashflow = {
            income: incomeTransactions.reduce(
              (acc, t) => {
                const category = t.category?.name || 'Uncategorized';
                const existing = acc.find((i) => i.category === category);
                if (existing) {
                  existing.amount += t.amount.toNumber();
                } else {
                  acc.push({ category, amount: t.amount.toNumber() });
                }
                return acc;
              },
              [] as Array<{ category: string; amount: number }>
            ),
            expenses: expenseTransactions.reduce(
              (acc, t) => {
                const category = t.category?.name || 'Uncategorized';
                const existing = acc.find((i) => i.category === category);
                if (existing) {
                  existing.amount += t.amount.toNumber();
                } else {
                  acc.push({ category, amount: t.amount.toNumber() });
                }
                return acc;
              },
              [] as Array<{ category: string; amount: number }>
            ),
          };

          const totalIncome = cashflow.income.reduce((sum, item) => sum + item.amount, 0);
          const totalExpenses = Math.abs(
            cashflow.expenses.reduce((sum, item) => sum + item.amount, 0)
          );
          const netSavings = totalIncome - totalExpenses;

          doc.fontSize(12);
          doc.text(`Total Income: ${space.currency} ${totalIncome.toFixed(2)}`, 50, 100);
          doc.text(`Total Expenses: ${space.currency} ${totalExpenses.toFixed(2)}`, 50, 120);
          doc.text(`Net Savings: ${space.currency} ${netSavings.toFixed(2)}`, 50, 140);
          doc.text(
            `Savings Rate: ${totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : 0}%`,
            50,
            160
          );

          // Income Breakdown
          doc.addPage();
          doc.fontSize(20).text('Income Breakdown', 50, 50);
          doc.fontSize(12);

          let yPos = 100;
          for (const income of cashflow.income) {
            doc.text(`${income.category}: ${space.currency} ${income.amount.toFixed(2)}`, 50, yPos);
            yPos += 20;
          }

          // Expense Breakdown
          doc.addPage();
          doc.fontSize(20).text('Expense Breakdown', 50, 50);
          doc.fontSize(12);

          const spending = await this.analyticsService.getSpendingByCategory(
            space.userSpaces[0]?.userId || '',
            spaceId,
            startDate,
            endDate
          );

          yPos = 100;
          for (const category of spending.sort((a, b) => b.amount - a.amount)) {
            doc.text(
              `${category.categoryName}: ${space.currency} ${category.amount.toFixed(2)} (${category.percentage.toFixed(1)}%)`,
              50,
              yPos
            );
            yPos += 20;
            if (yPos > 700) {
              doc.addPage();
              yPos = 50;
            }
          }

          // Budget Performance
          const budgets = await this.prisma.budget.findMany({
            where: {
              spaceId,
            },
            include: {
              categories: true,
            },
          });

          if (budgets.length > 0) {
            doc.addPage();
            doc.fontSize(20).text('Budget Performance', 50, 50);
            doc.fontSize(12);

            yPos = 100;
            for (const budget of budgets) {
              // Calculate budget spending
              const budgetTransactions = await this.prisma.transaction.findMany({
                where: {
                  account: { spaceId },
                  date: {
                    gte: startDate,
                    lte: endDate,
                  },
                  categoryId: {
                    in: budget.categories.map((c) => c.id),
                  },
                },
              });

              const totalSpent = Math.abs(
                budgetTransactions
                  .filter((t) => t.amount.lt(0))
                  .reduce((sum, t) => sum + t.amount.toNumber(), 0)
              );
              const totalBudgetAmount = budget.categories.reduce(
                (sum, c) => sum + c.budgetedAmount.toNumber(),
                0
              );
              const percentageUsed =
                totalBudgetAmount > 0 ? (totalSpent / totalBudgetAmount) * 100 : 0;

              const spent = { totalSpent, percentageUsed };

              doc.text(`${budget.name}:`, 50, yPos);
              yPos += 20;
              doc.text(`  Budget: ${space.currency} ${totalBudgetAmount.toFixed(2)}`, 50, yPos);
              yPos += 20;
              doc.text(
                `  Spent: ${space.currency} ${spent.totalSpent.toFixed(2)} (${spent.percentageUsed.toFixed(1)}%)`,
                50,
                yPos
              );
              yPos += 30;

              if (yPos > 700) {
                doc.addPage();
                yPos = 50;
              }
            }
          }

          // Account Balances
          doc.addPage();
          doc.fontSize(20).text('Account Balances', 50, 50);
          doc.fontSize(12);

          const accounts = await this.prisma.account.findMany({
            where: { spaceId },
            orderBy: { balance: 'desc' },
          });

          yPos = 100;
          let totalBalance = 0;
          for (const account of accounts) {
            doc.text(
              `${account.name}: ${account.currency} ${account.balance.toFixed(2)}`,
              50,
              yPos
            );
            totalBalance += account.balance.toNumber();
            yPos += 20;
            if (yPos > 700) {
              doc.addPage();
              yPos = 50;
            }
          }

          doc.text(`Total Balance: ${space.currency} ${totalBalance.toFixed(2)}`, 50, yPos + 20);

          // Footer
          doc
            .fontSize(10)
            .text(`Generated by Dhanam on ${format(new Date(), 'MMMM d, yyyy')}`, 50, 750);

          doc.end();
        } catch (error) {
          reject(error);
        }
      })();
    });
  }

  async generateCsvExport(spaceId: string, startDate: Date, endDate: Date): Promise<string> {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        account: { spaceId },
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        account: true,
        category: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    // CSV Header
    let csv = 'Date,Account,Category,Description,Amount,Currency\n';

    // CSV Data
    for (const transaction of transactions) {
      csv += `"${format(transaction.date, 'yyyy-MM-dd')}",`;
      csv += `"${transaction.account.name}",`;
      csv += `"${transaction.category?.name || 'Uncategorized'}",`;
      csv += `"${transaction.description.replace(/"/g, '""')}",`;
      csv += `${transaction.amount.toFixed(2)},`;
      csv += `${transaction.currency}\n`;
    }

    return csv;
  }
}
