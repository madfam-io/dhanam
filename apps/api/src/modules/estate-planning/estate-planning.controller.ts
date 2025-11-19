import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { EstatePlanningService } from './estate-planning.service';
import { CreateWillDto, UpdateWillDto, AddBeneficiaryDto, UpdateBeneficiaryDto, AddExecutorDto, UpdateExecutorDto } from './dto';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { SubscriptionGuard } from '../billing/guards/subscription.guard';
import { RequiresPremium } from '../billing/decorators/requires-tier.decorator';

@Controller('wills')
@UseGuards(JwtAuthGuard, SubscriptionGuard)
@RequiresPremium()
export class EstatePlanningController {
  constructor(private estatePlanningService: EstatePlanningService) {}

  /**
   * Create a new will (draft status)
   */
  @Post()
  async createWill(@Body() dto: CreateWillDto, @Req() req: any) {
    return this.estatePlanningService.createWill(dto, req.user.id);
  }

  /**
   * Get all wills for a household
   */
  @Get('household/:householdId')
  async findByHousehold(@Param('householdId') householdId: string, @Req() req: any) {
    return this.estatePlanningService.findByHousehold(householdId, req.user.id);
  }

  /**
   * Get a single will by ID
   */
  @Get(':id')
  async findById(@Param('id') id: string, @Req() req: any) {
    return this.estatePlanningService.findById(id, req.user.id);
  }

  /**
   * Update a will
   */
  @Put(':id')
  async updateWill(@Param('id') id: string, @Body() dto: UpdateWillDto, @Req() req: any) {
    return this.estatePlanningService.updateWill(id, dto, req.user.id);
  }

  /**
   * Delete a will (draft only)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteWill(@Param('id') id: string, @Req() req: any) {
    await this.estatePlanningService.deleteWill(id, req.user.id);
  }

  /**
   * Activate a will
   * Rate limited to prevent abuse: 3 activations per hour
   */
  @Post(':id/activate')
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 activations per hour
  async activateWill(@Param('id') id: string, @Req() req: any) {
    return this.estatePlanningService.activateWill(id, req.user.id);
  }

  /**
   * Revoke a will
   * Rate limited to prevent abuse: 5 revocations per hour
   */
  @Post(':id/revoke')
  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 revocations per hour
  async revokeWill(@Param('id') id: string, @Req() req: any) {
    return this.estatePlanningService.revokeWill(id, req.user.id);
  }

  /**
   * Validate beneficiary allocations
   */
  @Get(':id/validate')
  async validateWill(@Param('id') id: string, @Req() req: any) {
    // Verify access first
    await this.estatePlanningService.findById(id, req.user.id);
    return this.estatePlanningService.validateBeneficiaryAllocations(id);
  }

  /**
   * Add a beneficiary to a will
   */
  @Post(':id/beneficiaries')
  async addBeneficiary(
    @Param('id') id: string,
    @Body() dto: AddBeneficiaryDto,
    @Req() req: any
  ) {
    return this.estatePlanningService.addBeneficiary(id, dto, req.user.id);
  }

  /**
   * Update a beneficiary
   */
  @Put(':id/beneficiaries/:beneficiaryId')
  async updateBeneficiary(
    @Param('id') id: string,
    @Param('beneficiaryId') beneficiaryId: string,
    @Body() dto: UpdateBeneficiaryDto,
    @Req() req: any
  ) {
    return this.estatePlanningService.updateBeneficiary(id, beneficiaryId, dto, req.user.id);
  }

  /**
   * Remove a beneficiary from a will
   */
  @Delete(':id/beneficiaries/:beneficiaryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeBeneficiary(
    @Param('id') id: string,
    @Param('beneficiaryId') beneficiaryId: string,
    @Req() req: any
  ) {
    await this.estatePlanningService.removeBeneficiary(id, beneficiaryId, req.user.id);
  }

  /**
   * Add an executor to a will
   */
  @Post(':id/executors')
  async addExecutor(
    @Param('id') id: string,
    @Body() dto: AddExecutorDto,
    @Req() req: any
  ) {
    return this.estatePlanningService.addExecutor(id, dto, req.user.id);
  }

  /**
   * Update an executor
   */
  @Put(':id/executors/:executorId')
  async updateExecutor(
    @Param('id') id: string,
    @Param('executorId') executorId: string,
    @Body() dto: UpdateExecutorDto,
    @Req() req: any
  ) {
    return this.estatePlanningService.updateExecutor(id, executorId, dto, req.user.id);
  }

  /**
   * Remove an executor from a will
   */
  @Delete(':id/executors/:executorId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeExecutor(
    @Param('id') id: string,
    @Param('executorId') executorId: string,
    @Req() req: any
  ) {
    await this.estatePlanningService.removeExecutor(id, executorId, req.user.id);
  }
}
