import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { AuditService } from '../../core/audit/audit.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { OrderType, OrderPriority } from '../transaction-execution/dto/create-order.dto';
import { ProviderFactoryService } from '../transaction-execution/providers/provider-factory.service';
import { TransactionExecutionService } from '../transaction-execution/transaction-execution.service';

interface RebalancingAction {
  goalId: string;
  goalName: string;
  accountId: string;
  action: 'buy' | 'sell';
  amount: number;
  assetSymbol?: string;
  reason: string;
}

/**
 * Goals Auto-Execution Service
 * Handles automatic portfolio rebalancing based on goal allocations
 */
@Injectable()
export class GoalsExecutionService {
  private readonly logger = new Logger(GoalsExecutionService.name);
  private readonly REBALANCE_THRESHOLD = 0.05; // 5% drift triggers rebalance

  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private transactionExecution: TransactionExecutionService,
    private providerFactory: ProviderFactoryService
  ) {}

  /**
   * Analyze goals and generate rebalancing actions
   * Runs daily at 2 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async analyzeGoalsForRebalancing() {
    this.logger.log('Starting daily goals rebalancing analysis');

    try {
      // Get all active goals
      const activeGoals = await this.prisma.goal.findMany({
        where: { status: 'active' },
        include: {
          allocations: {
            include: {
              account: true,
            },
          },
          space: {
            include: {
              userSpaces: {
                take: 1,
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });

      this.logger.log(`Found ${activeGoals.length} active goals to analyze`);

      for (const goal of activeGoals) {
        try {
          await this.analyzeGoalRebalancing(goal);
        } catch (error) {
          this.logger.error(`Failed to analyze goal ${goal.id}:`, error);
          // Continue with next goal
        }
      }

      this.logger.log('Daily goals rebalancing analysis completed');
    } catch (error) {
      this.logger.error('Failed to run goals rebalancing analysis:', error);
    }
  }

  /**
   * Analyze a specific goal for rebalancing needs
   */
  async analyzeGoalRebalancing(goal: any): Promise<RebalancingAction[]> {
    const actions: RebalancingAction[] = [];

    if (!goal.allocations || goal.allocations.length === 0) {
      return actions; // No allocations to rebalance
    }

    // Calculate current total value across all allocated accounts
    // (Used for future rebalancing logic)
    const _currentTotalValue = goal.allocations.reduce((sum: number, allocation: any) => {
      return sum + Number(allocation.account.balance);
    }, 0);

    // Calculate target allocations
    for (const allocation of goal.allocations) {
      const targetPercentage = Number(allocation.percentage) / 100;
      const targetValue = Number(goal.targetAmount) * targetPercentage;
      const currentValue = Number(allocation.account.balance);
      const drift = Math.abs(currentValue - targetValue) / targetValue;

      // Check if drift exceeds threshold
      if (drift > this.REBALANCE_THRESHOLD) {
        const difference = targetValue - currentValue;
        const action: RebalancingAction = {
          goalId: goal.id,
          goalName: goal.name,
          accountId: allocation.accountId,
          action: difference > 0 ? 'buy' : 'sell',
          amount: Math.abs(difference),
          assetSymbol: allocation.account.metadata?.cryptoCurrency,
          reason: `Drift of ${(drift * 100).toFixed(2)}% detected`,
        };

        actions.push(action);

        this.logger.log(
          `Rebalancing needed for goal ${goal.name}: ${action.action} ${action.amount} in account ${allocation.accountId}`
        );
      }
    }

    // Execute rebalancing actions if user has auto-rebalancing enabled
    if (actions.length > 0) {
      await this.executeRebalancingActions(goal, actions);
    }

    return actions;
  }

  /**
   * Execute rebalancing actions for a goal
   */
  private async executeRebalancingActions(goal: any, actions: RebalancingAction[]) {
    const userId = goal.space.userSpaces[0]?.user?.id;
    if (!userId) {
      this.logger.warn(`No user found for goal ${goal.id}`);
      return;
    }

    for (const action of actions) {
      try {
        // Determine provider based on account
        const account = await this.prisma.account.findUnique({
          where: { id: action.accountId },
        });

        if (!account) {
          this.logger.warn(`Account ${action.accountId} not found`);
          continue;
        }

        // Create auto-execution order
        const order = await this.transactionExecution.createOrder(
          goal.spaceId,
          userId,
          {
            accountId: action.accountId,
            idempotencyKey: `goal-rebalance-${goal.id}-${action.accountId}-${Date.now()}`,
            type: action.action === 'buy' ? OrderType.buy : OrderType.sell,
            priority: OrderPriority.critical, // High priority for goal-driven execution
            amount: action.amount,
            currency: account.currency as any,
            assetSymbol: action.assetSymbol,
            provider: account.provider as any,
            dryRun: false, // Real execution
            autoExecute: true, // Auto-execute after verification
            goalId: goal.id,
            notes: `Auto-rebalance: ${action.reason}`,
            metadata: {
              type: 'goal_rebalance',
              goalName: goal.name,
              targetAllocation: action.amount,
            },
          },
          undefined, // No IP address for automated execution
          'dhanam-auto-rebalance' // User agent
        );

        // Audit the auto-rebalance order
        await this.audit.log({
          userId,
          action: 'goal_auto_rebalance',
          resource: 'goal',
          resourceId: goal.id,
          metadata: {
            orderId: order.id,
            action: action.action,
            amount: action.amount,
            reason: action.reason,
          },
          severity: 'high',
        });

        this.logger.log(`Auto-rebalance order created: ${order.id} for goal ${goal.name}`);
      } catch (error) {
        this.logger.error(
          `Failed to create rebalancing order for goal ${goal.id}, action ${action.action}:`,
          error
        );
      }
    }
  }

  /**
   * Calculate goal progress
   * Includes current value across all allocated accounts
   */
  async calculateGoalProgress(goalId: string) {
    const goal = await this.prisma.goal.findUnique({
      where: { id: goalId },
      include: {
        allocations: {
          include: {
            account: true,
          },
        },
      },
    });

    if (!goal) {
      throw new Error('Goal not found');
    }

    const currentValue = goal.allocations.reduce((sum: number, allocation: any) => {
      return sum + Number(allocation.account.balance);
    }, 0);

    const targetValue = Number(goal.targetAmount);
    const progress = (currentValue / targetValue) * 100;

    // Calculate days until target date
    const now = new Date();
    const targetDate = new Date(goal.targetDate);
    const daysRemaining = Math.max(
      0,
      Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );

    // Calculate required monthly contribution
    const monthsRemaining = Math.max(1, daysRemaining / 30);
    const shortfall = Math.max(0, targetValue - currentValue);
    const requiredMonthlyContribution = shortfall / monthsRemaining;

    return {
      goalId: goal.id,
      goalName: goal.name,
      currentValue,
      targetValue,
      progress,
      daysRemaining,
      monthsRemaining: Math.ceil(monthsRemaining),
      requiredMonthlyContribution,
      onTrack: progress >= (1 - daysRemaining / 365) * 100, // Simple linear projection
      allocations: goal.allocations.map((allocation: any) => ({
        accountId: allocation.accountId,
        accountName: allocation.account.name,
        targetPercentage: Number(allocation.percentage),
        currentValue: Number(allocation.account.balance),
        targetValue: (targetValue * Number(allocation.percentage)) / 100,
      })),
    };
  }

  /**
   * Suggest rebalancing for a specific goal
   * Called on-demand by user
   */
  async suggestRebalancing(goalId: string, userId: string) {
    const goal = await this.prisma.goal.findFirst({
      where: {
        id: goalId,
        space: {
          userSpaces: {
            some: { userId },
          },
        },
      },
      include: {
        allocations: {
          include: {
            account: true,
          },
        },
        space: {
          include: {
            userSpaces: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!goal) {
      throw new Error('Goal not found or access denied');
    }

    const actions = await this.analyzeGoalRebalancing(goal);

    return {
      goalId: goal.id,
      goalName: goal.name,
      actions,
      summary: {
        totalActions: actions.length,
        buyActions: actions.filter((a) => a.action === 'buy').length,
        sellActions: actions.filter((a) => a.action === 'sell').length,
        estimatedValue: actions.reduce((sum, a) => sum + a.amount, 0),
      },
    };
  }

  /**
   * Execute goal rebalancing immediately
   * Called on-demand by user
   */
  async executeGoalRebalancing(goalId: string, userId: string) {
    const goal = await this.prisma.goal.findFirst({
      where: {
        id: goalId,
        space: {
          userSpaces: {
            some: { userId },
          },
        },
      },
      include: {
        allocations: {
          include: {
            account: true,
          },
        },
        space: {
          include: {
            userSpaces: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!goal) {
      throw new Error('Goal not found or access denied');
    }

    const actions = await this.analyzeGoalRebalancing(goal);

    if (actions.length === 0) {
      return {
        message: 'Goal is already balanced, no actions needed',
        actions: [],
      };
    }

    await this.executeRebalancingActions(goal, actions);

    return {
      message: `Created ${actions.length} rebalancing orders`,
      actions,
    };
  }
}
