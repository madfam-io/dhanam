import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiParam,
} from '@nestjs/swagger';

import { CurrentUser } from '@core/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';

import { SpaceGuard } from '../spaces/guards/space.guard';

import { CorrectionAggregatorService } from './correction-aggregator.service';
import { CategoryCorrectionService } from './correction.service';
import { ProviderSelectionService } from './provider-selection.service';
import { SplitPredictionService } from './split-prediction.service';
import { TransactionCategorizationService } from './transaction-categorization.service';

@ApiTags('ML & AI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
@ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
export class MlController {
  constructor(
    private providerSelection: ProviderSelectionService,
    private categorization: TransactionCategorizationService,
    private splitPrediction: SplitPredictionService,
    private correctionService: CategoryCorrectionService,
    private correctionAggregator: CorrectionAggregatorService
  ) {}

  // Provider Selection Endpoints

  @Get('ml/provider-insights')
  @ApiOperation({ summary: 'Get provider selection insights' })
  @ApiOkResponse({ description: 'Provider performance metrics' })
  async getProviderInsights(
    @Query('region') region: string = 'US',
    @Query('days') days: number = 30
  ) {
    return this.providerSelection.getProviderInsights(region, days);
  }

  // Transaction Categorization Endpoints

  @Post('spaces/:spaceId/transactions/:transactionId/predict-category')
  @UseGuards(SpaceGuard)
  @ApiOperation({ summary: 'Predict category for transaction using ML' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiParam({ name: 'transactionId', description: 'Transaction UUID' })
  @ApiOkResponse({ description: 'Category prediction with confidence' })
  @ApiNotFoundResponse({ description: 'Transaction not found' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  async predictCategory(
    @Param('spaceId') spaceId: string,
    @Param('transactionId') transactionId: string
  ) {
    // Get transaction details
    const transaction = await this.categorization['prisma'].transaction.findFirst({
      where: {
        id: transactionId,
        account: { spaceId },
      },
    });

    if (!transaction) {
      return { error: 'Transaction not found' };
    }

    const prediction = await this.categorization.predictCategory(
      spaceId,
      transaction.description,
      transaction.merchant,
      parseFloat(transaction.amount.toString())
    );

    return prediction;
  }

  @Post('spaces/:spaceId/transactions/:transactionId/auto-categorize')
  @UseGuards(SpaceGuard)
  @ApiOperation({ summary: 'Auto-categorize transaction if confidence is high' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiParam({ name: 'transactionId', description: 'Transaction UUID' })
  @ApiOkResponse({ description: 'Categorization result' })
  @ApiNotFoundResponse({ description: 'Transaction not found' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  async autoCategorize(
    @Param('spaceId') spaceId: string,
    @Param('transactionId') transactionId: string
  ) {
    const transaction = await this.categorization['prisma'].transaction.findFirst({
      where: {
        id: transactionId,
        account: { spaceId },
      },
    });

    if (!transaction) {
      return { error: 'Transaction not found' };
    }

    return this.categorization.autoCategorize(
      transactionId,
      spaceId,
      transaction.description,
      transaction.merchant,
      parseFloat(transaction.amount.toString())
    );
  }

  @Get('spaces/:spaceId/ml/categorization-accuracy')
  @UseGuards(SpaceGuard)
  @ApiOperation({ summary: 'Get categorization accuracy metrics' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiOkResponse({ description: 'Accuracy metrics' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  async getCategorizationAccuracy(
    @Param('spaceId') spaceId: string,
    @Query('days') days: number = 30
  ) {
    return this.categorization.getCategorizationAccuracy(spaceId, days);
  }

  // Split Prediction Endpoints

  @Post('spaces/:spaceId/transactions/:transactionId/suggest-split')
  @UseGuards(SpaceGuard)
  @ApiOperation({ summary: 'Get AI-suggested split amounts for transaction' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiParam({ name: 'transactionId', description: 'Transaction UUID' })
  @ApiOkResponse({ description: 'Split suggestions with confidence' })
  @ApiNotFoundResponse({ description: 'Transaction not found' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  @ApiBadRequestResponse({ description: 'Invalid household member IDs' })
  async suggestSplit(
    @Param('spaceId') spaceId: string,
    @Param('transactionId') transactionId: string,
    @Body() body: { householdMemberIds: string[] }
  ) {
    const transaction = await this.splitPrediction['prisma'].transaction.findFirst({
      where: {
        id: transactionId,
        account: { spaceId },
      },
    });

    if (!transaction) {
      return { error: 'Transaction not found' };
    }

    const suggestions = await this.splitPrediction.suggestSplits(
      spaceId,
      parseFloat(transaction.amount.toString()),
      transaction.merchant,
      transaction.categoryId,
      body.householdMemberIds
    );

    return { suggestions };
  }

  @Get('spaces/:spaceId/ml/split-accuracy')
  @UseGuards(SpaceGuard)
  @ApiOperation({ summary: 'Get split prediction accuracy metrics' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiOkResponse({ description: 'Split prediction metrics' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  async getSplitAccuracy(@Param('spaceId') spaceId: string, @Query('days') days: number = 30) {
    return this.splitPrediction.getSplitPredictionAccuracy(spaceId, days);
  }

  // Combined ML Insights Dashboard

  @Get('spaces/:spaceId/ml/insights')
  @UseGuards(SpaceGuard)
  @ApiOperation({ summary: 'Get comprehensive ML insights dashboard' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiOkResponse({ description: 'Complete ML performance metrics' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  async getMlInsights(@Param('spaceId') spaceId: string, @Query('days') days: number = 30) {
    const [categorization, splits] = await Promise.all([
      this.categorization.getCategorizationAccuracy(spaceId, days),
      this.splitPrediction.getSplitPredictionAccuracy(spaceId, days),
    ]);

    return {
      period: `${days} days`,
      categorization,
      splits,
      summary: {
        autoCategorizedTransactions: categorization.totalAutoCategorized,
        splitTransactions: splits.totalSplitTransactions,
        mlSavingsEstimate: this.calculateMlSavings(
          categorization.totalAutoCategorized,
          splits.totalSplitTransactions
        ),
      },
    };
  }

  /**
   * Calculate estimated time savings from ML
   */
  private calculateMlSavings(autoCategorized: number, splits: number): string {
    // Assume 30 seconds saved per auto-categorization
    // Assume 2 minutes saved per split suggestion
    const categorizationSeconds = autoCategorized * 30;
    const splitSeconds = splits * 120;
    const totalSeconds = categorizationSeconds + splitSeconds;

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    return `${hours}h ${minutes}m saved`;
  }

  // Category Correction Endpoints (Learning Loop)

  @Post('spaces/:spaceId/transactions/:transactionId/correct-category')
  @UseGuards(SpaceGuard)
  @ApiOperation({ summary: 'Correct transaction category (ML learning loop)' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiParam({ name: 'transactionId', description: 'Transaction UUID' })
  @ApiOkResponse({ description: 'Correction recorded and applied' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  @ApiBadRequestResponse({ description: 'Invalid category ID' })
  async correctCategory(
    @Param('spaceId') spaceId: string,
    @Param('transactionId') transactionId: string,
    @Body() body: { categoryId: string; applyToFuture?: boolean },
    @CurrentUser() user: { id: string }
  ) {
    await this.correctionService.recordCorrection({
      transactionId,
      spaceId,
      correctedCategoryId: body.categoryId,
      userId: user.id,
      applyToFuture: body.applyToFuture ?? true,
    });

    // Invalidate pattern cache after correction
    this.correctionAggregator.invalidateCache(spaceId);

    return { success: true, message: 'Category corrected and patterns updated' };
  }

  @Get('spaces/:spaceId/ml/learned-patterns')
  @UseGuards(SpaceGuard)
  @ApiOperation({ summary: 'Get learned categorization patterns from corrections' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiOkResponse({ description: 'List of learned merchant patterns' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  async getLearnedPatterns(@Param('spaceId') spaceId: string) {
    return this.correctionService.getLearnedPatterns(spaceId);
  }

  @Get('spaces/:spaceId/ml/correction-stats')
  @UseGuards(SpaceGuard)
  @ApiOperation({ summary: 'Get category correction statistics' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiOkResponse({ description: 'Correction statistics' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  async getCorrectionStats(@Param('spaceId') spaceId: string, @Query('days') days: number = 30) {
    return this.correctionService.getCorrectionStats(spaceId, days);
  }

  @Get('spaces/:spaceId/ml/pattern-stats')
  @UseGuards(SpaceGuard)
  @ApiOperation({ summary: 'Get aggregated pattern statistics' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiOkResponse({ description: 'Pattern statistics' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  async getPatternStats(@Param('spaceId') spaceId: string) {
    return this.correctionAggregator.getPatternStats(spaceId);
  }
}
