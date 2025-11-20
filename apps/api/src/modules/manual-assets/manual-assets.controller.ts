import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';

import { ManualAssetsService } from './manual-assets.service';
import {
  CreateManualAssetDto,
  UpdateManualAssetDto,
  ManualAssetResponseDto,
  ManualAssetSummaryDto,
  AddValuationDto,
  ManualAssetValuationDto,
} from './dto';

@ApiTags('manual-assets')
@Controller('spaces/:spaceId/manual-assets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ManualAssetsController {
  constructor(private readonly manualAssetsService: ManualAssetsService) {}

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
  findOne(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Req() req: Request
  ) {
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
}
