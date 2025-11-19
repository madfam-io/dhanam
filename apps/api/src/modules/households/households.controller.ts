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
import { HouseholdsService } from './households.service';
import { CreateHouseholdDto, UpdateHouseholdDto, AddMemberDto, UpdateMemberDto } from './dto';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';

@Controller('households')
@UseGuards(JwtAuthGuard)
export class HouseholdsController {
  constructor(private householdsService: HouseholdsService) {}

  /**
   * Create a new household
   */
  @Post()
  async create(@Body() dto: CreateHouseholdDto, @Req() req: any) {
    return this.householdsService.create(dto, req.user.id);
  }

  /**
   * Get all households for the current user
   */
  @Get()
  async findAll(@Req() req: any) {
    return this.householdsService.findByUser(req.user.id);
  }

  /**
   * Get a single household by ID
   */
  @Get(':id')
  async findById(@Param('id') id: string, @Req() req: any) {
    return this.householdsService.findById(id, req.user.id);
  }

  /**
   * Update a household
   */
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateHouseholdDto, @Req() req: any) {
    return this.householdsService.update(id, dto, req.user.id);
  }

  /**
   * Delete a household
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @Req() req: any) {
    await this.householdsService.delete(id, req.user.id);
  }

  /**
   * Get household net worth aggregation
   */
  @Get(':id/net-worth')
  async getNetWorth(@Param('id') id: string, @Req() req: any) {
    return this.householdsService.getNetWorth(id, req.user.id);
  }

  /**
   * Get household goal summary
   */
  @Get(':id/goals/summary')
  async getGoalSummary(@Param('id') id: string, @Req() req: any) {
    return this.householdsService.getGoalSummary(id, req.user.id);
  }

  /**
   * Add a member to a household
   */
  @Post(':id/members')
  async addMember(
    @Param('id') id: string,
    @Body() dto: AddMemberDto,
    @Req() req: any
  ) {
    return this.householdsService.addMember(id, dto, req.user.id);
  }

  /**
   * Update a household member
   */
  @Put(':id/members/:memberId')
  async updateMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberDto,
    @Req() req: any
  ) {
    return this.householdsService.updateMember(id, memberId, dto, req.user.id);
  }

  /**
   * Remove a member from a household
   */
  @Delete(':id/members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Req() req: any
  ) {
    await this.householdsService.removeMember(id, memberId, req.user.id);
  }
}
