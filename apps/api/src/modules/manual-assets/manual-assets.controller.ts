import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';

import {
  CreateManualAssetDto,
  UpdateManualAssetDto,
  ManualAssetResponseDto,
  ManualAssetSummaryDto,
  AddValuationDto,
  ManualAssetValuationDto,
} from './dto';
import { ManualAssetsService } from './manual-assets.service';
import { PEAnalyticsService, CreatePECashFlowDto } from './pe-analytics.service';

@ApiTags('manual-assets')
@Controller('spaces/:spaceId/manual-assets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ManualAssetsController {
  constructor(
    private readonly manualAssetsService: ManualAssetsService,
    private readonly peAnalyticsService: PEAnalyticsService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all manual assets in a space' })
  @ApiOkResponse({ type: [ManualAssetResponseDto] })
  findAll(@Param('spaceId') spaceId: string, @Req() req: Request) {
    return this.manualAssetsService.findAll(spaceId, req.user!.id);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get manual assets summary with totals by type' })
  @ApiOkResponse({ type: ManualAssetSummaryDto })
  getSummary(@Param('spaceId') spaceId: string, @Req() req: Request) {
    return this.manualAssetsService.getSummary(spaceId, req.user!.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a manual asset by id' })
  @ApiOkResponse({ type: ManualAssetResponseDto })
  findOne(@Param('spaceId') spaceId: string, @Param('id') id: string, @Req() req: Request) {
    return this.manualAssetsService.findOne(spaceId, req.user!.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new manual asset' })
  @ApiOkResponse({ type: ManualAssetResponseDto })
  create(
    @Param('spaceId') spaceId: string,
    @Body() createManualAssetDto: CreateManualAssetDto,
    @Req() req: Request
  ) {
    return this.manualAssetsService.create(spaceId, req.user!.id, createManualAssetDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a manual asset' })
  @ApiOkResponse({ type: ManualAssetResponseDto })
  update(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Body() updateManualAssetDto: UpdateManualAssetDto,
    @Req() req: Request
  ) {
    return this.manualAssetsService.update(spaceId, req.user!.id, id, updateManualAssetDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a manual asset' })
  remove(@Param('spaceId') spaceId: string, @Param('id') id: string, @Req() req: Request) {
    return this.manualAssetsService.remove(spaceId, req.user!.id, id);
  }

  @Post(':id/valuations')
  @ApiOperation({ summary: 'Add a valuation entry to track asset value over time' })
  @ApiOkResponse({ type: ManualAssetValuationDto })
  addValuation(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Body() addValuationDto: AddValuationDto,
    @Req() req: Request
  ) {
    return this.manualAssetsService.addValuation(spaceId, req.user!.id, id, addValuationDto);
  }

  // ==================== Private Equity Endpoints ====================

  @Get('pe/portfolio')
  @ApiOperation({
    summary: 'Get PE portfolio summary',
    description:
      'Returns aggregated performance metrics for all private equity and angel investments in the space',
  })
  @ApiResponse({
    status: 200,
    description: 'Portfolio summary with TVPI, DPI, IRR and per-asset breakdown',
  })
  getPEPortfolioSummary(@Param('spaceId') spaceId: string, @Req() req: Request) {
    return this.peAnalyticsService.getPortfolioSummary(spaceId, req.user!.id);
  }

  @Get(':id/performance')
  @ApiOperation({
    summary: 'Get PE performance metrics',
    description:
      'Returns IRR, TVPI, DPI, RVPI and other performance metrics for a private equity asset',
  })
  @ApiResponse({
    status: 200,
    description: 'Performance metrics including IRR, multiples, and cash flow summary',
  })
  getPEPerformance(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Req() req: Request
  ) {
    return this.peAnalyticsService.getPerformance(spaceId, req.user!.id, id);
  }

  @Get(':id/cash-flows')
  @ApiOperation({
    summary: 'Get cash flows for a PE asset',
    description: 'Returns all capital calls, distributions, and fees for a private equity asset',
  })
  @ApiResponse({
    status: 200,
    description: 'List of cash flows ordered by date',
  })
  getPECashFlows(@Param('spaceId') spaceId: string, @Param('id') id: string, @Req() req: Request) {
    return this.peAnalyticsService.getCashFlows(spaceId, req.user!.id, id);
  }

  @Post(':id/cash-flows')
  @ApiOperation({
    summary: 'Add a cash flow to a PE asset',
    description:
      'Record a capital call, distribution, management fee, or carried interest for a private equity asset',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['type', 'amount', 'currency', 'date'],
      properties: {
        type: {
          type: 'string',
          enum: ['capital_call', 'distribution', 'management_fee', 'carry', 'recallable'],
          description: 'Type of cash flow',
        },
        amount: { type: 'number', description: 'Cash flow amount (always positive)' },
        currency: { type: 'string', enum: ['USD', 'MXN', 'EUR'] },
        date: { type: 'string', format: 'date', description: 'Date of cash flow' },
        description: { type: 'string', description: 'Optional description' },
        notes: { type: 'string', description: 'Optional notes' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Cash flow created successfully',
  })
  addPECashFlow(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Body() dto: CreatePECashFlowDto,
    @Req() req: Request
  ) {
    return this.peAnalyticsService.addCashFlow(spaceId, req.user!.id, id, dto);
  }

  @Delete(':id/cash-flows/:cashFlowId')
  @ApiOperation({
    summary: 'Delete a cash flow from a PE asset',
    description: 'Remove a capital call, distribution, or fee record',
  })
  @ApiResponse({
    status: 200,
    description: 'Cash flow deleted successfully',
  })
  deletePECashFlow(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Param('cashFlowId') cashFlowId: string,
    @Req() req: Request
  ) {
    return this.peAnalyticsService.deleteCashFlow(spaceId, req.user!.id, id, cashFlowId);
  }
}
