import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RequiresPremium } from '../billing/decorators/requires-tier.decorator';
import { SubscriptionGuard } from '../billing/guards/subscription.guard';

import { CreateOrderDto, VerifyOrderDto, UpdateOrderDto, OrderFilterDto } from './dto';
import { TransactionExecutionService } from './transaction-execution.service';

@Controller('spaces/:spaceId/orders')
@UseGuards(JwtAuthGuard, SubscriptionGuard)
@RequiresPremium()
export class TransactionExecutionController {
  constructor(private transactionExecutionService: TransactionExecutionService) {}

  /**
   * Create a new transaction order
   * Rate limited to prevent abuse: 10 orders per minute
   */
  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async createOrder(
    @Param('spaceId') spaceId: string,
    @Body() dto: CreateOrderDto,
    @Req() req: any
  ) {
    return this.transactionExecutionService.createOrder(
      spaceId,
      req.user.id,
      dto,
      req.ip,
      req.headers['user-agent']
    );
  }

  /**
   * Get all orders for a space
   */
  @Get()
  async findAll(
    @Param('spaceId') spaceId: string,
    @Query() filter: OrderFilterDto,
    @Req() req: any
  ) {
    return this.transactionExecutionService.findAll(spaceId, req.user.id, filter);
  }

  /**
   * Get a single order by ID
   */
  @Get(':id')
  async findOne(@Param('spaceId') spaceId: string, @Param('id') id: string, @Req() req: any) {
    return this.transactionExecutionService.findOne(id, req.user.id);
  }

  /**
   * Update a pending order
   */
  @Put(':id')
  async updateOrder(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateOrderDto,
    @Req() req: any
  ) {
    return this.transactionExecutionService.updateOrder(
      id,
      req.user.id,
      dto,
      req.ip,
      req.headers['user-agent']
    );
  }

  /**
   * Verify order with OTP
   * Rate limited to prevent brute force: 5 attempts per 5 minutes
   */
  @Post(':id/verify')
  @Throttle({ default: { limit: 5, ttl: 300000 } })
  async verifyOrder(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Body() dto: VerifyOrderDto,
    @Req() req: any
  ) {
    return this.transactionExecutionService.verifyOrder(
      id,
      req.user.id,
      dto,
      req.ip,
      req.headers['user-agent']
    );
  }

  /**
   * Execute a verified order
   * Rate limited to prevent abuse: 10 executions per minute
   */
  @Post(':id/execute')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async executeOrder(@Param('spaceId') spaceId: string, @Param('id') id: string, @Req() req: any) {
    return this.transactionExecutionService.executeOrder(
      id,
      req.user.id,
      req.ip,
      req.headers['user-agent']
    );
  }

  /**
   * Cancel a pending order
   */
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelOrder(@Param('spaceId') spaceId: string, @Param('id') id: string, @Req() req: any) {
    return this.transactionExecutionService.cancelOrder(
      id,
      req.user.id,
      req.ip,
      req.headers['user-agent']
    );
  }
}
