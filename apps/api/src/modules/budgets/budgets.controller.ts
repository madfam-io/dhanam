import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { BudgetsService } from './budgets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateBudgetDto, UpdateBudgetDto, BudgetResponseDto, BudgetSummaryDto } from './dto';
import { Request } from 'express';

@ApiTags('budgets')
@Controller('spaces/:spaceId/budgets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all budgets in a space' })
  @ApiOkResponse({ type: [BudgetResponseDto] })
  findAll(@Param('spaceId') spaceId: string, @Req() req: Request) {
    return this.budgetsService.findAll(spaceId, req.user!.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a budget by id' })
  @ApiOkResponse({ type: BudgetResponseDto })
  findOne(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.budgetsService.findOne(spaceId, req.user!.id, id);
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'Get budget summary with spending details' })
  @ApiOkResponse({ type: BudgetSummaryDto })
  getBudgetSummary(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.budgetsService.getBudgetSummary(spaceId, req.user!.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new budget' })
  @ApiOkResponse({ type: BudgetResponseDto })
  create(
    @Param('spaceId') spaceId: string,
    @Body() createBudgetDto: CreateBudgetDto,
    @Req() req: Request,
  ) {
    return this.budgetsService.create(spaceId, req.user!.id, createBudgetDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a budget' })
  @ApiOkResponse({ type: BudgetResponseDto })
  update(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Body() updateBudgetDto: UpdateBudgetDto,
    @Req() req: Request,
  ) {
    return this.budgetsService.update(spaceId, req.user!.id, id, updateBudgetDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a budget' })
  remove(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.budgetsService.remove(spaceId, req.user!.id, id);
  }
}