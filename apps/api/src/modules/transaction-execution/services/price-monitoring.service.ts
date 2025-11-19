import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { PrismaService } from '../../../core/prisma/prisma.service';
import { TransactionExecutionService } from '../transaction-execution.service';

interface PriceUpdate {
  symbol: string;
  currency: string;
  price: number;
  timestamp: Date;
}

@Injectable()
export class PriceMonitoringService {
  private readonly logger = new Logger(PriceMonitoringService.name);
  private readonly priceCache = new Map<string, PriceUpdate>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionExecution: TransactionExecutionService
  ) {}

  /**
   * Monitor prices every 5 minutes for active advanced orders
   */
  @Cron('*/5 * * * *') // Every 5 minutes
  async monitorPrices() {
    this.logger.log('Starting price monitoring cycle');

    try {
      // Get all pending_trigger orders
      const orders = await this.prisma.transactionOrder.findMany({
        where: {
          status: 'pending_trigger',
          advancedType: { not: null },
        },
        include: {
          account: true,
        },
        orderBy: {
          priority: 'desc',
        },
      });

      if (orders.length === 0) {
        this.logger.debug('No pending trigger orders to monitor');
        return;
      }

      this.logger.log(`Monitoring ${orders.length} advanced orders`);

      // Group orders by asset+currency for batch price fetching
      const priceKeys = new Set<string>();
      orders.forEach((order) => {
        if (order.assetSymbol) {
          priceKeys.add(`${order.assetSymbol}-${order.currency}`);
        }
      });

      // Fetch current prices
      await this.fetchPrices(Array.from(priceKeys));

      // Evaluate each order
      for (const order of orders) {
        await this.evaluateOrder(order);
      }

      this.logger.log('Price monitoring cycle completed');
    } catch (error) {
      this.logger.error('Error in price monitoring', error);
    }
  }

  /**
   * Fetch current prices for assets
   */
  private async fetchPrices(priceKeys: string[]): Promise<void> {
    for (const key of priceKeys) {
      try {
        const [symbol, currency] = key.split('-');
        const price = await this.getCurrentPrice(symbol, currency);

        if (price) {
          this.priceCache.set(key, {
            symbol,
            currency,
            price,
            timestamp: new Date(),
          });
        }
      } catch (error) {
        this.logger.error(`Failed to fetch price for ${key}`, error);
      }
    }
  }

  /**
   * Get current price from provider or external API
   */
  private async getCurrentPrice(symbol: string, currency: string): Promise<number | null> {
    // In production, this would call actual price APIs
    // For now, return mock data
    const key = `${symbol}-${currency}`;

    // Check cache first (valid for 5 minutes)
    const cached = this.priceCache.get(key);
    if (cached && Date.now() - cached.timestamp.getTime() < 5 * 60 * 1000) {
      return cached.price;
    }

    // Mock prices for development
    const mockPrices: Record<string, number> = {
      'BTC-USD': 45000,
      'BTC-MXN': 900000,
      'ETH-USD': 3000,
      'ETH-MXN': 60000,
    };

    return mockPrices[key] || null;
  }

  /**
   * Evaluate order against current price
   */
  private async evaluateOrder(order: any): Promise<void> {
    if (!order.assetSymbol) {
      this.logger.warn(`Order ${order.id} has no asset symbol`);
      return;
    }

    const priceKey = `${order.assetSymbol}-${order.currency}`;
    const priceUpdate = this.priceCache.get(priceKey);

    if (!priceUpdate) {
      this.logger.warn(`No price available for ${priceKey}`);
      return;
    }

    const currentPrice = priceUpdate.price;
    let shouldTrigger = false;
    let triggerReason = '';

    // Evaluate based on advanced order type
    switch (order.advancedType) {
      case 'stop_loss':
        shouldTrigger = await this.evaluateStopLoss(order, currentPrice);
        triggerReason = `Stop-loss triggered: price ${currentPrice} <= stop ${order.stopPrice}`;
        break;

      case 'take_profit':
        shouldTrigger = await this.evaluateTakeProfit(order, currentPrice);
        triggerReason = `Take-profit triggered: price ${currentPrice} >= target ${order.takeProfitPrice}`;
        break;

      case 'trailing_stop':
        shouldTrigger = await this.evaluateTrailingStop(order, currentPrice);
        triggerReason = 'Trailing stop triggered';
        break;

      case 'oco':
        shouldTrigger = await this.evaluateOCO(order, currentPrice);
        triggerReason = 'OCO order triggered';
        break;
    }

    // Update last price check
    await this.prisma.transactionOrder.update({
      where: { id: order.id },
      data: {
        lastPriceCheck: new Date(),
        ...(order.advancedType === 'trailing_stop' && {
          highestPrice: Math.max(Number(order.highestPrice || 0), currentPrice),
        }),
      },
    });

    // Trigger order if conditions met
    if (shouldTrigger) {
      this.logger.log(`Triggering order ${order.id}: ${triggerReason}`);
      await this.triggerOrder(order, currentPrice, triggerReason);
    }
  }

  /**
   * Evaluate stop-loss order
   * Triggers when price drops to or below stop price
   */
  private async evaluateStopLoss(order: any, currentPrice: number): Promise<boolean> {
    if (!order.stopPrice) return false;
    return currentPrice <= Number(order.stopPrice);
  }

  /**
   * Evaluate take-profit order
   * Triggers when price reaches or exceeds target price
   */
  private async evaluateTakeProfit(order: any, currentPrice: number): Promise<boolean> {
    if (!order.takeProfitPrice) return false;
    return currentPrice >= Number(order.takeProfitPrice);
  }

  /**
   * Evaluate trailing stop order
   * Triggers when price drops by trailing amount/percent from highest price
   */
  private async evaluateTrailingStop(order: any, currentPrice: number): Promise<boolean> {
    const highestPrice = Math.max(Number(order.highestPrice || 0), currentPrice);

    if (order.trailingAmount) {
      const stopPrice = highestPrice - Number(order.trailingAmount);
      return currentPrice <= stopPrice;
    }

    if (order.trailingPercent) {
      const stopPrice = highestPrice * (1 - Number(order.trailingPercent) / 100);
      return currentPrice <= stopPrice;
    }

    return false;
  }

  /**
   * Evaluate one-cancels-other order
   * Triggers when either stop-loss or take-profit is hit
   */
  private async evaluateOCO(order: any, currentPrice: number): Promise<boolean> {
    if (order.stopPrice && currentPrice <= Number(order.stopPrice)) {
      return true; // Stop-loss hit
    }

    if (order.takeProfitPrice && currentPrice >= Number(order.takeProfitPrice)) {
      return true; // Take-profit hit
    }

    return false;
  }

  /**
   * Trigger order for execution
   * Converts advanced order to market order and executes
   */
  private async triggerOrder(order: any, triggerPrice: number, reason: string): Promise<void> {
    try {
      // Update order status and convert to market order
      await this.prisma.transactionOrder.update({
        where: { id: order.id },
        data: {
          status: 'pending_execution',
          notes: `${order.notes || ''}\n\nTriggered: ${reason} at price ${triggerPrice}`.trim(),
        },
      });

      // Cancel linked order if OCO
      if (order.advancedType === 'oco' && order.linkedOrderId) {
        await this.prisma.transactionOrder.update({
          where: { id: order.linkedOrderId },
          data: {
            status: 'cancelled',
            notes: `Cancelled by OCO order ${order.id}`,
          },
        });
      }

      // Execute the order
      await this.transactionExecution.executeOrder(order.spaceId, order.userId, order.id);

      this.logger.log(`Successfully triggered and executed order ${order.id}`);
    } catch (error) {
      this.logger.error(`Failed to trigger order ${order.id}`, error);

      // Mark order as failed
      await this.prisma.transactionOrder.update({
        where: { id: order.id },
        data: {
          status: 'failed',
          errorCode: 'TRIGGER_EXECUTION_FAILED',
          errorMessage: error.message,
        },
      });
    }
  }

  /**
   * Manually trigger price check for specific order
   */
  async checkOrderPrice(orderId: string): Promise<void> {
    const order = await this.prisma.transactionOrder.findUnique({
      where: { id: orderId },
      include: { account: true },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== 'pending_trigger') {
      throw new Error('Order is not in pending_trigger status');
    }

    await this.evaluateOrder(order);
  }
}
