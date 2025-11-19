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

import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';

import { CreateGoalDto, UpdateGoalDto, AddAllocationDto } from './dto';
import { GoalsExecutionService } from './goals-execution.service';
import { GoalsService } from './goals.service';

@Controller('goals')
@UseGuards(JwtAuthGuard)
export class GoalsController {
  constructor(
    private goalsService: GoalsService,
    private goalsExecutionService: GoalsExecutionService
  ) {}

  /**
   * Create a new goal
   */
  @Post()
  async create(@Body() dto: CreateGoalDto, @Req() req: any) {
    return this.goalsService.create(dto, req.user.id);
  }

  /**
   * Get all goals for a space
   */
  @Get('space/:spaceId')
  async findBySpace(@Param('spaceId') spaceId: string, @Req() req: any) {
    return this.goalsService.findBySpace(spaceId, req.user.id);
  }

  /**
   * Get summary for all goals in a space
   */
  @Get('space/:spaceId/summary')
  async getSummary(@Param('spaceId') spaceId: string, @Req() req: any) {
    return this.goalsService.getSummary(spaceId, req.user.id);
  }

  /**
   * Get a single goal by ID
   */
  @Get(':id')
  async findById(@Param('id') id: string, @Req() req: any) {
    return this.goalsService.findById(id, req.user.id);
  }

  /**
   * Update a goal
   */
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateGoalDto, @Req() req: any) {
    return this.goalsService.update(id, dto, req.user.id);
  }

  /**
   * Delete a goal
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @Req() req: any) {
    await this.goalsService.delete(id, req.user.id);
  }

  /**
   * Get progress for a goal
   */
  @Get(':id/progress')
  async getProgress(@Param('id') id: string, @Req() req: any) {
    return this.goalsService.calculateProgress(id, req.user.id);
  }

  /**
   * Add an allocation to a goal
   */
  @Post(':id/allocations')
  async addAllocation(@Param('id') id: string, @Body() dto: AddAllocationDto, @Req() req: any) {
    return this.goalsService.addAllocation(id, dto, req.user.id);
  }

  /**
   * Remove an allocation from a goal
   */
  @Delete(':id/allocations/:accountId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeAllocation(
    @Param('id') id: string,
    @Param('accountId') accountId: string,
    @Req() req: any
  ) {
    await this.goalsService.removeAllocation(id, accountId, req.user.id);
  }

  /**
   * Get goal progress including rebalancing recommendations
   */
  @Get(':id/progress')
  async getProgress(@Param('id') id: string, @Req() req: any) {
    return this.goalsExecutionService.calculateGoalProgress(id);
  }

  /**
   * Get rebalancing suggestions for a goal
   */
  @Get(':id/rebalancing/suggest')
  async suggestRebalancing(@Param('id') id: string, @Req() req: any) {
    return this.goalsExecutionService.suggestRebalancing(id, req.user.id);
  }

  /**
   * Execute rebalancing for a goal
   */
  @Post(':id/rebalancing/execute')
  async executeRebalancing(@Param('id') id: string, @Req() req: any) {
    return this.goalsExecutionService.executeGoalRebalancing(id, req.user.id);
  }
}
