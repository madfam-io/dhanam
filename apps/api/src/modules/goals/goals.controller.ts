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
import { GoalProbabilityService } from './goal-probability.service';
import { GoalCollaborationService } from './goal-collaboration.service';

@Controller('goals')
@UseGuards(JwtAuthGuard)
export class GoalsController {
  constructor(
    private goalsService: GoalsService,
    private goalsExecutionService: GoalsExecutionService,
    private goalProbabilityService: GoalProbabilityService,
    private goalCollaborationService: GoalCollaborationService
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
  @Get(':id/progress/detailed')
  async getDetailedProgress(@Param('id') id: string, @Req() _req: any) {
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

  /**
   * Get goal probability (Monte Carlo simulation)
   */
  @Get(':id/probability')
  async getProbability(@Param('id') id: string, @Req() req: any) {
    return this.goalProbabilityService.calculateGoalProbability(req.user.id, id);
  }

  /**
   * Update goal probability (recalculate)
   */
  @Post(':id/probability/update')
  async updateProbability(@Param('id') id: string, @Req() req: any) {
    await this.goalProbabilityService.updateGoalProbability(req.user.id, id);
    return { message: 'Probability updated successfully' };
  }

  /**
   * Run what-if scenario for a goal
   */
  @Post(':id/what-if')
  async runWhatIf(
    @Param('id') id: string,
    @Body() scenario: {
      monthlyContribution?: number;
      targetAmount?: number;
      targetDate?: string;
      expectedReturn?: number;
      volatility?: number;
    },
    @Req() req: any
  ) {
    const scenarioData = {
      ...scenario,
      targetDate: scenario.targetDate ? new Date(scenario.targetDate) : undefined,
    };
    return this.goalProbabilityService.runWhatIfScenario(req.user.id, id, scenarioData);
  }

  /**
   * Bulk update probabilities for all goals in a space
   */
  @Post('space/:spaceId/probability/update-all')
  async updateAllProbabilities(@Param('spaceId') spaceId: string, @Req() req: any) {
    await this.goalProbabilityService.updateAllGoalProbabilities(req.user.id, spaceId);
    return { message: 'All goal probabilities updated successfully' };
  }

  // ==================== Collaboration Endpoints ====================

  /**
   * Share a goal with another user
   */
  @Post(':id/share')
  async shareGoal(
    @Param('id') goalId: string,
    @Body() body: {
      shareWithEmail: string;
      role: 'viewer' | 'contributor' | 'editor' | 'manager';
      message?: string;
    },
    @Req() req: any
  ) {
    return this.goalCollaborationService.shareGoal(req.user.id, {
      goalId,
      ...body,
    });
  }

  /**
   * Get all shares for a goal
   */
  @Get(':id/shares')
  async getGoalShares(@Param('id') goalId: string, @Req() req: any) {
    return this.goalCollaborationService.getGoalShares(req.user.id, goalId);
  }

  /**
   * Get all goals shared with me
   */
  @Get('shared/me')
  async getSharedGoals(@Req() req: any) {
    return this.goalCollaborationService.getSharedGoals(req.user.id);
  }

  /**
   * Accept a goal share invitation
   */
  @Post('shares/:shareId/accept')
  async acceptShare(@Param('shareId') shareId: string, @Req() req: any) {
    return this.goalCollaborationService.acceptShare(req.user.id, shareId);
  }

  /**
   * Decline a goal share invitation
   */
  @Post('shares/:shareId/decline')
  @HttpCode(HttpStatus.NO_CONTENT)
  async declineShare(@Param('shareId') shareId: string, @Req() req: any) {
    await this.goalCollaborationService.declineShare(req.user.id, shareId);
  }

  /**
   * Revoke a goal share
   */
  @Delete('shares/:shareId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeShare(@Param('shareId') shareId: string, @Req() req: any) {
    await this.goalCollaborationService.revokeShare(req.user.id, shareId);
  }

  /**
   * Update share role
   */
  @Put('shares/:shareId/role')
  async updateShareRole(
    @Param('shareId') shareId: string,
    @Body() body: { newRole: 'viewer' | 'contributor' | 'editor' | 'manager' },
    @Req() req: any
  ) {
    return this.goalCollaborationService.updateShareRole(req.user.id, {
      shareId,
      newRole: body.newRole,
    });
  }

  /**
   * Get activity feed for a goal
   */
  @Get(':id/activities')
  async getGoalActivities(@Param('id') goalId: string, @Req() req: any) {
    return this.goalCollaborationService.getGoalActivities(req.user.id, goalId);
  }
}
