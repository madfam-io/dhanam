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
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiBody,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';

import { DocumentService, ConfirmUploadDto } from './document.service';
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
import { RealEstateValuationService } from './real-estate-valuation.service';

@ApiTags('manual-assets')
@Controller('spaces/:spaceId/manual-assets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ManualAssetsController {
  constructor(
    private readonly manualAssetsService: ManualAssetsService,
    private readonly peAnalyticsService: PEAnalyticsService,
    private readonly documentService: DocumentService,
    private readonly realEstateValuationService: RealEstateValuationService
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

  // ==================== Document Management Endpoints ====================

  @Get('document-config')
  @ApiOperation({
    summary: 'Get document upload configuration',
    description: 'Returns allowed file types, categories, and storage availability',
  })
  getDocumentConfig() {
    return {
      available: this.documentService.isStorageAvailable(),
      allowedFileTypes: this.documentService.getAllowedFileTypes(),
      categories: this.documentService.getDocumentCategories(),
      maxFileSizeMB: 50,
    };
  }

  @Get(':id/documents')
  @ApiOperation({
    summary: 'Get all documents for an asset',
    description: 'Returns list of uploaded documents with metadata',
  })
  getDocuments(@Param('spaceId') spaceId: string, @Param('id') id: string, @Req() req: Request) {
    return this.documentService.getDocuments(spaceId, req.user!.id, id);
  }

  @Post(':id/documents/upload-url')
  @ApiOperation({
    summary: 'Get presigned URL for document upload',
    description: 'Returns a presigned URL for direct browser upload to R2 storage',
  })
  @ApiQuery({ name: 'filename', required: true, description: 'Original filename' })
  @ApiQuery({ name: 'contentType', required: true, description: 'MIME type of the file' })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Document category (deed, title, appraisal, etc.)',
  })
  getUploadUrl(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Query('filename') filename: string,
    @Query('contentType') contentType: string,
    @Query('category') category: string = 'general',
    @Req() req: Request
  ) {
    return this.documentService.getUploadUrl(
      spaceId,
      req.user!.id,
      id,
      filename,
      contentType,
      category
    );
  }

  @Post(':id/documents/confirm')
  @ApiOperation({
    summary: 'Confirm document upload completion',
    description: 'Call after successful upload to add document to asset record',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['key', 'filename', 'fileType', 'fileSize'],
      properties: {
        key: { type: 'string', description: 'Storage key returned from upload-url' },
        filename: { type: 'string', description: 'Original filename' },
        fileType: { type: 'string', description: 'MIME type' },
        fileSize: { type: 'number', description: 'File size in bytes' },
        category: { type: 'string', description: 'Document category' },
      },
    },
  })
  confirmUpload(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Body() dto: ConfirmUploadDto,
    @Req() req: Request
  ) {
    return this.documentService.confirmUpload(spaceId, req.user!.id, id, dto);
  }

  @Get(':id/documents/:documentKey/download-url')
  @ApiOperation({
    summary: 'Get presigned URL for document download',
    description: 'Returns a time-limited URL for downloading the document',
  })
  getDownloadUrl(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Param('documentKey') documentKey: string,
    @Req() req: Request
  ) {
    // Decode the key since it may contain slashes
    const decodedKey = decodeURIComponent(documentKey);
    return this.documentService.getDownloadUrl(spaceId, req.user!.id, id, decodedKey);
  }

  @Delete(':id/documents/:documentKey')
  @ApiOperation({
    summary: 'Delete a document from an asset',
    description: 'Removes document from both storage and asset record',
  })
  deleteDocument(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Param('documentKey') documentKey: string,
    @Req() req: Request
  ) {
    const decodedKey = decodeURIComponent(documentKey);
    return this.documentService.deleteDocument(spaceId, req.user!.id, id, decodedKey);
  }

  // ==================== Real Estate Valuation Endpoints ====================

  @Post(':id/zillow/link')
  @ApiOperation({
    summary: 'Link property to Zillow',
    description: 'Look up the property address in Zillow and link for automatic valuations',
  })
  @ApiResponse({
    status: 200,
    description: 'Property linked to Zillow successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Property not found in Zillow or missing address information',
  })
  linkToZillow(@Param('spaceId') spaceId: string, @Param('id') id: string, @Req() req: Request) {
    // Verify space access first
    void req.user!.id;
    return this.realEstateValuationService.linkToZillow(spaceId, id);
  }

  @Post(':id/zillow/unlink')
  @ApiOperation({
    summary: 'Unlink property from Zillow',
    description: 'Stop automatic Zillow valuations for this property',
  })
  @ApiResponse({
    status: 200,
    description: 'Property unlinked from Zillow',
  })
  unlinkFromZillow(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Req() req: Request
  ) {
    void req.user!.id;
    return this.realEstateValuationService.unlinkFromZillow(spaceId, id);
  }

  @Post(':id/zillow/refresh')
  @ApiOperation({
    summary: 'Refresh Zillow valuation',
    description: 'Manually trigger a valuation refresh from Zillow',
  })
  @ApiResponse({
    status: 200,
    description: 'Valuation refreshed',
  })
  refreshZillowValuation(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Req() req: Request
  ) {
    void req.user!.id;
    return this.realEstateValuationService.refreshValuation(spaceId, id);
  }

  @Get(':id/zillow/summary')
  @ApiOperation({
    summary: 'Get property valuation summary',
    description: 'Returns current and Zillow valuations with comparison',
  })
  @ApiResponse({
    status: 200,
    description: 'Valuation summary including Zestimate range and rent estimate',
  })
  getValuationSummary(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Req() req: Request
  ) {
    void req.user!.id;
    return this.realEstateValuationService.getValuationSummary(spaceId, id);
  }

  @Post('real-estate/refresh-all')
  @ApiOperation({
    summary: 'Refresh all Zillow valuations',
    description: 'Refresh valuations for all Zillow-linked properties in the space',
  })
  @ApiResponse({
    status: 200,
    description: 'Refresh results for all properties',
  })
  refreshAllZillowValuations(@Param('spaceId') spaceId: string, @Req() req: Request) {
    void req.user!.id;
    return this.realEstateValuationService.refreshAllInSpace(spaceId);
  }
}
