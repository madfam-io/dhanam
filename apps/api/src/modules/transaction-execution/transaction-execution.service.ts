import * as crypto from 'crypto';

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { addDays, addWeeks, addMonths, isAfter } from 'date-fns';

import { AuditService } from '../../core/audit/audit.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { SpacesService } from '../spaces/spaces.service';

import { CreateOrderDto, VerifyOrderDto, UpdateOrderDto, OrderFilterDto } from './dto';

// Import enums from DTO
import { OrderType, OrderPriority, ExecutionProvider } from './dto/create-order.dto';
import { OrderStatus } from './dto/order-filter.dto';
import {
  ExecutionOrder,
  OrderType as ProviderOrderType,
} from './providers/execution-provider.interface';
import { ProviderFactoryService } from './providers/provider-factory.service';

interface OrderExecutionResult {
  success: boolean;
  executedAmount?: number;
  executedPrice?: number;
  fees?: number;
  feeCurrency?: string;
  providerOrderId?: string;
  errorCode?: string;
  errorMessage?: string;
  providerResponse?: any;
}

@Injectable()
export class TransactionExecutionService {
  private readonly logger = new Logger(TransactionExecutionService.name);
  private readonly HIGH_VALUE_THRESHOLD = 10000; // $10,000 USD

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private spacesService: SpacesService,
    private providerFactory: ProviderFactoryService
  ) {}

  /**
   * Create a new transaction order
   * Includes idempotency checking, limit validation, and audit logging
   */
  async createOrder(
    spaceId: string,
    userId: string,
    dto: CreateOrderDto,
    ipAddress?: string,
    userAgent?: string
  ) {
    // Verify user access to space
    await this.spacesService.verifyUserAccess(userId, spaceId, 'member');

    // Check idempotency
    const existingOrder = await this.checkIdempotency(userId, spaceId, dto.idempotencyKey, dto);
    if (existingOrder) {
      this.logger.log(`Idempotent request detected for key ${dto.idempotencyKey}`);
      return existingOrder;
    }

    // Verify account belongs to space
    const account = await this.prisma.account.findFirst({
      where: {
        id: dto.accountId,
        spaceId,
      },
    });

    if (!account) {
      throw new ForbiddenException('Account not found or does not belong to this space');
    }

    // Verify destination account for transfers
    if (dto.type === OrderType.transfer && dto.toAccountId) {
      const toAccount = await this.prisma.account.findFirst({
        where: {
          id: dto.toAccountId,
          spaceId,
        },
      });

      if (!toAccount) {
        throw new ForbiddenException(
          'Destination account not found or does not belong to this space'
        );
      }
    }

    // Check order limits
    await this.checkOrderLimits(userId, spaceId, dto.type, dto.amount, dto.currency);

    // Validate balance for sell/transfer orders
    if (dto.type === OrderType.sell || dto.type === OrderType.transfer) {
      await this.validateAccountBalance(account.id, dto.amount, dto.currency);
    }

    // Determine if OTP verification is required
    const requiresOtp = await this.requiresOtpVerification(userId, dto.amount, dto.type);

    // Calculate expiration (24 hours for pending orders)
    const expiresAt = addDays(new Date(), 1);

    // Create the order
    const order = await this.prisma.transactionOrder.create({
      data: {
        spaceId,
        userId,
        accountId: dto.accountId,
        idempotencyKey: dto.idempotencyKey,
        type: dto.type as any,
        status: requiresOtp ? ('pending_verification' as any) : ('pending_execution' as any),
        priority: (dto.priority || OrderPriority.normal) as any,
        amount: dto.amount,
        currency: dto.currency,
        assetSymbol: dto.assetSymbol,
        targetPrice: dto.targetPrice,
        toAccountId: dto.toAccountId,
        provider: dto.provider as any,
        dryRun: dto.dryRun || false,
        maxSlippage: dto.maxSlippage,
        goalId: dto.goalId,
        autoExecute: dto.autoExecute || false,
        notes: dto.notes,
        metadata: dto.metadata as Prisma.JsonObject,
        ipAddress,
        userAgent,
        expiresAt,
      },
      include: {
        account: true,
        toAccount: true,
        goal: true,
      },
    });

    // Store idempotency key
    await this.storeIdempotencyKey(userId, spaceId, dto.idempotencyKey, dto, order.id, 200, order);

    // Audit log
    await this.auditService.log({
      userId,
      action: 'order_created',
      resource: 'transaction_order',
      resourceId: order.id,
      metadata: JSON.stringify({
        type: dto.type,
        amount: dto.amount,
        currency: dto.currency,
        provider: dto.provider,
        dryRun: dto.dryRun,
        requiresOtp,
      }),
      ipAddress,
      userAgent,
      severity: dto.amount >= this.HIGH_VALUE_THRESHOLD ? 'high' : 'medium',
    });

    this.logger.log(`Order ${order.id} created for user ${userId}`);

    // Auto-execute if no OTP required and autoExecute is true
    if (!requiresOtp && dto.autoExecute) {
      setImmediate(() => {
        this.executeOrder(order.id, userId, ipAddress, userAgent).catch((error) => {
          this.logger.error(`Failed to auto-execute order ${order.id}:`, error);
        });
      });
    }

    return order;
  }

  /**
   * Verify an order with OTP code
   */
  async verifyOrder(
    orderId: string,
    userId: string,
    dto: VerifyOrderDto,
    ipAddress?: string,
    userAgent?: string
  ) {
    const order = await this.findOrderById(orderId, userId);

    if (order.status !== 'pending_verification') {
      throw new BadRequestException('Order is not pending verification');
    }

    // Verify OTP code (simplified - in production, use proper OTP validation)
    const isValidOtp = await this.validateOtp(userId, dto.otpCode);
    if (!isValidOtp) {
      // Audit failed verification
      await this.auditService.log({
        userId,
        action: 'order_verification_failed',
        resource: 'transaction_order',
        resourceId: orderId,
        metadata: JSON.stringify({ reason: 'Invalid OTP code' }),
        ipAddress,
        userAgent,
        severity: 'high',
      });

      throw new BadRequestException('Invalid OTP code');
    }

    // Update order status
    const updatedOrder = await this.prisma.transactionOrder.update({
      where: { id: orderId },
      data: {
        status: 'pending_execution' as any,
        otpVerified: true,
        otpVerifiedAt: new Date(),
        verifiedAt: new Date(),
      },
      include: {
        account: true,
        toAccount: true,
        goal: true,
      },
    });

    // Audit successful verification
    await this.auditService.log({
      userId,
      action: 'order_verified',
      resource: 'transaction_order',
      resourceId: orderId,
      metadata: JSON.stringify({ verificationMethod: 'otp' }),
      ipAddress,
      userAgent,
      severity: 'high',
    });

    this.logger.log(`Order ${orderId} verified successfully`);

    // Auto-execute if autoExecute is true
    if (updatedOrder.autoExecute) {
      setImmediate(() => {
        this.executeOrder(orderId, userId, ipAddress, userAgent).catch((error) => {
          this.logger.error(`Failed to auto-execute verified order ${orderId}:`, error);
        });
      });
    }

    return updatedOrder;
  }

  /**
   * Execute a pending order
   * Main orchestration method that handles the execution flow
   */
  async executeOrder(orderId: string, userId: string, ipAddress?: string, userAgent?: string) {
    const order = await this.findOrderById(orderId, userId);

    // Validate order can be executed
    if (order.status !== 'pending_execution') {
      throw new BadRequestException(`Order cannot be executed in status: ${order.status}`);
    }

    // Check if order has expired
    if (order.expiresAt && isAfter(new Date(), order.expiresAt)) {
      await this.prisma.transactionOrder.update({
        where: { id: orderId },
        data: { status: 'rejected' as any },
      });
      throw new BadRequestException('Order has expired');
    }

    // Update status to executing
    await this.prisma.transactionOrder.update({
      where: { id: orderId },
      data: { status: 'executing' as any },
    });

    // Create execution record
    const execution = await this.prisma.orderExecution.create({
      data: {
        orderId,
        attemptNumber: 1,
        status: 'executing' as any,
        provider: order.provider as any,
        startedAt: new Date(),
      },
    });

    try {
      let result: OrderExecutionResult;

      // Execute based on dry-run mode
      if (order.dryRun) {
        result = await this.executeDryRun(order);
      } else {
        result = await this.executeReal(order);
      }

      // Update order and execution with results
      if (result.success) {
        const completedOrder = await this.prisma.transactionOrder.update({
          where: { id: orderId },
          data: {
            status: 'completed' as any,
            executedAmount: result.executedAmount,
            executedPrice: result.executedPrice,
            fees: result.fees,
            feeCurrency: result.feeCurrency as any,
            providerOrderId: result.providerOrderId,
            providerResponse: result.providerResponse as Prisma.JsonObject,
            executedAt: new Date(),
            completedAt: new Date(),
          },
          include: {
            account: true,
            toAccount: true,
            goal: true,
          },
        });

        await this.prisma.orderExecution.update({
          where: { id: execution.id },
          data: {
            status: 'completed' as any,
            executedAmount: result.executedAmount,
            executedPrice: result.executedPrice,
            fees: result.fees,
            feeCurrency: result.feeCurrency as any,
            providerOrderId: result.providerOrderId,
            providerResponse: result.providerResponse as Prisma.JsonObject,
            completedAt: new Date(),
            duration: Date.now() - execution.startedAt.getTime(),
          },
        });

        // Update order limits
        await this.updateOrderLimits(userId, order.spaceId, order.type as any, order.amount);

        // Audit successful execution
        await this.auditService.log({
          userId,
          action: 'order_executed',
          resource: 'transaction_order',
          resourceId: orderId,
          metadata: JSON.stringify({
            type: order.type,
            amount: result.executedAmount,
            price: result.executedPrice,
            fees: result.fees,
            provider: order.provider,
            dryRun: order.dryRun,
          }),
          ipAddress,
          userAgent,
          severity: 'high',
        });

        this.logger.log(`Order ${orderId} executed successfully`);
        return completedOrder;
      } else {
        // Execution failed
        await this.prisma.transactionOrder.update({
          where: { id: orderId },
          data: { status: 'failed' as any },
        });

        await this.prisma.orderExecution.update({
          where: { id: execution.id },
          data: {
            status: 'failed' as any,
            errorCode: result.errorCode,
            errorMessage: result.errorMessage,
            providerResponse: result.providerResponse as Prisma.JsonObject,
            completedAt: new Date(),
            duration: Date.now() - execution.startedAt.getTime(),
          },
        });

        // Audit failed execution
        await this.auditService.log({
          userId,
          action: 'order_execution_failed',
          resource: 'transaction_order',
          resourceId: orderId,
          metadata: JSON.stringify({
            errorCode: result.errorCode,
            errorMessage: result.errorMessage,
          }),
          ipAddress,
          userAgent,
          severity: 'high',
        });

        throw new BadRequestException(result.errorMessage || 'Order execution failed');
      }
    } catch (error) {
      // Handle unexpected errors
      await this.prisma.transactionOrder.update({
        where: { id: orderId },
        data: { status: 'failed' as any },
      });

      await this.prisma.orderExecution.update({
        where: { id: execution.id },
        data: {
          status: 'failed' as any,
          errorCode: 'UNEXPECTED_ERROR',
          errorMessage: error.message,
          completedAt: new Date(),
          duration: Date.now() - execution.startedAt.getTime(),
        },
      });

      this.logger.error(`Order ${orderId} execution failed:`, error);
      throw error;
    }
  }

  /**
   * Execute order in dry-run mode (simulated execution)
   */
  private async executeDryRun(order: any): Promise<OrderExecutionResult> {
    this.logger.log(`Executing dry-run order ${order.id}`);

    // Simulate execution delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Simulate market price with 1-3% slippage
    const slippage = Math.random() * 0.03; // 0-3%
    const simulatedPrice = order.targetPrice
      ? Number(order.targetPrice)
      : Number(order.amount) * (1 + slippage);

    return {
      success: true,
      executedAmount: Number(order.amount),
      executedPrice: simulatedPrice,
      fees: Number(order.amount) * 0.002, // 0.2% fee
      feeCurrency: order.currency,
      providerOrderId: `dryrun_${Date.now()}`,
      providerResponse: {
        mode: 'dry_run',
        simulatedAt: new Date().toISOString(),
        slippage,
      },
    };
  }

  /**
   * Execute real order through provider
   */
  private async executeReal(order: any): Promise<OrderExecutionResult> {
    this.logger.log(`Executing real order ${order.id} via ${order.provider}`);

    try {
      // Get provider instance
      const provider = this.providerFactory.getProvider(order.provider);

      // Build execution order
      const executionOrder: ExecutionOrder = {
        id: order.id,
        type: order.type as ProviderOrderType,
        amount: Number(order.amount),
        currency: order.currency,
        assetSymbol: order.assetSymbol,
        targetPrice: order.targetPrice ? Number(order.targetPrice) : undefined,
        maxSlippage: order.maxSlippage ? Number(order.maxSlippage) : undefined,
        accountId: order.accountId,
        toAccountId: order.toAccountId,
        metadata: order.metadata,
      };

      // Validate order with provider
      const validation = await provider.validateOrder(executionOrder);
      if (!validation.valid) {
        return {
          success: false,
          errorCode: 'VALIDATION_ERROR',
          errorMessage: validation.errors?.join(', ') || 'Order validation failed',
        };
      }

      // Execute based on order type
      let result: OrderExecutionResult;

      switch (order.type) {
        case 'buy':
          result = await provider.executeBuy(executionOrder);
          break;
        case 'sell':
          result = await provider.executeSell(executionOrder);
          break;
        case 'transfer':
          result = await provider.executeTransfer(executionOrder);
          break;
        case 'deposit':
          result = await provider.executeDeposit(executionOrder);
          break;
        case 'withdraw':
          result = await provider.executeWithdraw(executionOrder);
          break;
        default:
          throw new BadRequestException(`Unsupported order type: ${order.type}`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Provider execution failed for order ${order.id}:`, error);
      return {
        success: false,
        errorCode: 'PROVIDER_ERROR',
        errorMessage: error.message,
      };
    }
  }

  /**
   * Cancel a pending order
   */
  async cancelOrder(orderId: string, userId: string, ipAddress?: string, userAgent?: string) {
    const order = await this.findOrderById(orderId, userId);

    // Can only cancel pending orders
    if (order.status !== 'pending_verification' && order.status !== 'pending_execution') {
      throw new BadRequestException(`Cannot cancel order in status: ${order.status}`);
    }

    const cancelledOrder = await this.prisma.transactionOrder.update({
      where: { id: orderId },
      data: {
        status: 'cancelled' as any,
        cancelledAt: new Date(),
      },
      include: {
        account: true,
        toAccount: true,
        goal: true,
      },
    });

    // Audit cancellation
    await this.auditService.log({
      userId,
      action: 'order_cancelled',
      resource: 'transaction_order',
      resourceId: orderId,
      metadata: JSON.stringify({ reason: 'User requested cancellation' }),
      ipAddress,
      userAgent,
      severity: 'medium',
    });

    this.logger.log(`Order ${orderId} cancelled by user ${userId}`);
    return cancelledOrder;
  }

  /**
   * Get all orders for a space
   */
  async findAll(spaceId: string, userId: string, filter: OrderFilterDto) {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const where: Prisma.TransactionOrderWhereInput = {
      spaceId,
      ...(filter.accountId && { accountId: filter.accountId }),
      ...(filter.status && { status: filter.status as any }),
      ...(filter.goalId && { goalId: filter.goalId }),
    };

    const orderBy: Prisma.TransactionOrderOrderByWithRelationInput = filter.sortBy
      ? { [filter.sortBy]: filter.sortOrder || 'desc' }
      : { createdAt: 'desc' };

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.transactionOrder.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          account: true,
          toAccount: true,
          goal: true,
          executions: {
            orderBy: { attemptNumber: 'desc' },
            take: 1,
          },
        },
      }),
      this.prisma.transactionOrder.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Get order by ID
   */
  async findOne(orderId: string, userId: string) {
    const order = await this.findOrderById(orderId, userId);

    // Include all execution attempts
    const executions = await this.prisma.orderExecution.findMany({
      where: { orderId },
      orderBy: { attemptNumber: 'asc' },
    });

    return {
      ...order,
      executions,
    };
  }

  /**
   * Update a pending order
   */
  async updateOrder(
    orderId: string,
    userId: string,
    dto: UpdateOrderDto,
    ipAddress?: string,
    userAgent?: string
  ) {
    const order = await this.findOrderById(orderId, userId);

    // Can only update pending orders
    if (order.status !== 'pending_verification' && order.status !== 'pending_execution') {
      throw new BadRequestException(`Cannot update order in status: ${order.status}`);
    }

    const updatedOrder = await this.prisma.transactionOrder.update({
      where: { id: orderId },
      data: {
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.targetPrice !== undefined && { targetPrice: dto.targetPrice }),
        ...(dto.maxSlippage !== undefined && { maxSlippage: dto.maxSlippage }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.metadata && { metadata: dto.metadata as Prisma.JsonObject }),
      },
      include: {
        account: true,
        toAccount: true,
        goal: true,
      },
    });

    // Audit update
    await this.auditService.log({
      userId,
      action: 'order_updated',
      resource: 'transaction_order',
      resourceId: orderId,
      metadata: JSON.stringify(dto),
      ipAddress,
      userAgent,
      severity: 'medium',
    });

    return updatedOrder;
  }

  /**
   * Helper: Find order by ID and verify user access
   */
  private async findOrderById(orderId: string, userId: string) {
    const order = await this.prisma.transactionOrder.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        account: true,
        toAccount: true,
        goal: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  /**
   * Helper: Check idempotency
   */
  private async checkIdempotency(userId: string, spaceId: string, key: string, requestBody: any) {
    const requestHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(requestBody))
      .digest('hex');

    const existing = await this.prisma.idempotencyKey.findUnique({
      where: { key },
    });

    if (existing) {
      // Check if request body matches
      if (existing.requestHash !== requestHash) {
        throw new ConflictException('Idempotency key already used with different request body');
      }

      // Check if expired
      if (isAfter(new Date(), existing.expiresAt)) {
        // Delete expired key
        await this.prisma.idempotencyKey.delete({ where: { key } });
        return null;
      }

      // Return cached response
      if (existing.orderId) {
        return this.prisma.transactionOrder.findUnique({
          where: { id: existing.orderId },
          include: {
            account: true,
            toAccount: true,
            goal: true,
          },
        });
      }
    }

    return null;
  }

  /**
   * Helper: Store idempotency key
   */
  private async storeIdempotencyKey(
    userId: string,
    spaceId: string,
    key: string,
    requestBody: any,
    orderId: string,
    responseStatus: number,
    responseBody: any
  ) {
    const requestHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(requestBody))
      .digest('hex');

    await this.prisma.idempotencyKey.create({
      data: {
        key,
        userId,
        spaceId,
        requestHash,
        orderId,
        responseStatus,
        responseBody: responseBody as Prisma.JsonObject,
        expiresAt: addDays(new Date(), 7), // 7 days expiration
      },
    });
  }

  /**
   * Helper: Check order limits
   */
  private async checkOrderLimits(
    userId: string,
    spaceId: string,
    orderType: OrderType,
    amount: number,
    currency: string
  ) {
    const now = new Date();

    // Find applicable limits
    const limits = await this.prisma.orderLimit.findMany({
      where: {
        userId,
        OR: [{ spaceId }, { spaceId: null }], // Global or space-specific
        OR: [{ orderType: orderType as any }, { orderType: null }], // Type-specific or all types
        enforced: true,
        resetAt: { gt: now },
      },
    });

    for (const limit of limits) {
      // Skip if different currency (simplified - real implementation would convert)
      if (limit.currency !== currency) continue;

      const availableAmount = Number(limit.maxAmount) - Number(limit.usedAmount);
      if (amount > availableAmount) {
        throw new BadRequestException(
          `Order exceeds ${limit.limitType} limit. Available: ${availableAmount} ${currency}`
        );
      }
    }
  }

  /**
   * Helper: Update order limits after successful execution
   */
  private async updateOrderLimits(
    userId: string,
    spaceId: string,
    orderType: OrderType,
    amount: number
  ) {
    const now = new Date();

    const limits = await this.prisma.orderLimit.findMany({
      where: {
        userId,
        OR: [{ spaceId }, { spaceId: null }],
        OR: [{ orderType: orderType as any }, { orderType: null }],
        enforced: true,
        resetAt: { gt: now },
      },
    });

    for (const limit of limits) {
      await this.prisma.orderLimit.update({
        where: { id: limit.id },
        data: {
          usedAmount: {
            increment: amount,
          },
        },
      });
    }
  }

  /**
   * Helper: Validate account balance for sell/transfer orders
   */
  private async validateAccountBalance(accountId: string, amount: number, currency: string) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // Simplified balance check (real implementation would handle crypto amounts)
    if (Number(account.balance) < amount) {
      throw new BadRequestException('Insufficient account balance');
    }
  }

  /**
   * Helper: Determine if OTP verification is required
   */
  private async requiresOtpVerification(
    userId: string,
    amount: number,
    orderType: OrderType
  ): Promise<boolean> {
    // Require OTP for high-value transactions
    if (amount >= this.HIGH_VALUE_THRESHOLD) {
      return true;
    }

    // Require OTP for sell orders (security measure)
    if (orderType === OrderType.sell || orderType === OrderType.withdraw) {
      return true;
    }

    // Check if user has TOTP enabled
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { totpEnabled: true },
    });

    // If TOTP enabled, require for all transactions
    return user?.totpEnabled || false;
  }

  /**
   * Helper: Validate OTP code
   * Simplified implementation - real version would use TOTP library
   */
  private async validateOtp(userId: string, otpCode: string): Promise<boolean> {
    // TODO: Implement proper TOTP validation using speakeasy or similar
    // For now, accept any 6-digit code in development
    return /^\d{6}$/.test(otpCode);
  }
}
