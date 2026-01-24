import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Post,
  Body,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { CurrentUser } from '@core/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { User } from '@db';

import { EnhancedEsgService } from './enhanced-esg.service';
import { EsgService } from './esg.service';

@ApiTags('ESG Scoring')
@Controller('esg')
export class EsgController {
  constructor(
    private readonly esgService: EsgService,
    private readonly enhancedEsgService: EnhancedEsgService
  ) {}

  @Get('score/:symbol')
  @ApiOperation({ summary: 'Get ESG score for an asset' })
  @ApiResponse({ status: 200, description: 'ESG score retrieved successfully' })
  @ApiQuery({ name: 'assetType', required: false, enum: ['crypto', 'equity', 'etf'] })
  async getEsgScore(@Param('symbol') symbol: string, @Query('assetType') assetType = 'crypto') {
    const score = await this.esgService.getEsgScore(symbol, assetType);
    return {
      ...score,
      methodology: 'Dhanam ESG Framework v2.0',
      dataSource: 'Dhanam Research',
    };
  }

  @Get('portfolio')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get portfolio ESG analysis' })
  @ApiResponse({ status: 200, description: 'Portfolio ESG analysis retrieved successfully' })
  async getPortfolioEsgScore(@CurrentUser() user: User) {
    const analysis = await this.esgService.getPortfolioEsgScore(user.id);
    return {
      ...analysis,
      methodology: 'Dhanam ESG Framework v2.0',
      analysisDate: new Date().toISOString(),
    };
  }

  @Post('compare')
  @ApiOperation({ summary: 'Compare ESG scores of multiple assets' })
  @ApiResponse({ status: 200, description: 'ESG comparison completed successfully' })
  async compareAssets(@Body('symbols') symbols: string[]) {
    if (!symbols || symbols.length === 0) {
      return { error: 'Please provide at least one symbol to compare' };
    }

    if (symbols.length > 10) {
      return { error: 'Maximum 10 symbols allowed for comparison' };
    }

    const comparison = await this.esgService.getAssetComparison(symbols);
    return {
      ...comparison,
      methodology: 'Dhanam ESG Framework v2.0',
      comparisonDate: new Date().toISOString(),
    };
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get ESG trends and market insights' })
  @ApiResponse({ status: 200, description: 'ESG trends retrieved successfully' })
  async getEsgTrends() {
    const trends = await this.esgService.getEsgTrends();
    return {
      ...trends,
      methodology: 'Dhanam ESG Framework v2.0',
      lastUpdated: new Date().toISOString(),
    };
  }

  @Get('methodology')
  @ApiOperation({ summary: 'Get ESG scoring methodology' })
  @ApiResponse({ status: 200, description: 'ESG methodology information' })
  getMethodology() {
    return {
      framework: 'Dhanam ESG Framework v2.0',
      description:
        'Comprehensive ESG scoring for digital assets with focus on environmental impact, social value, and governance quality',
      scoring: {
        environmental: {
          description: 'Energy efficiency, carbon footprint, consensus mechanism sustainability',
          factors: [
            'Energy consumption per transaction',
            'Carbon emissions',
            'Consensus mechanism efficiency',
            'Renewable energy usage',
            'Environmental commitments',
          ],
          weight: '33.3%',
        },
        social: {
          description: 'Financial inclusion, accessibility, community development',
          factors: [
            'Financial inclusion potential',
            'Transaction accessibility',
            'Community governance',
            'Developer ecosystem',
            'Educational initiatives',
          ],
          weight: '33.3%',
        },
        governance: {
          description: 'Decentralization, transparency, decision-making processes',
          factors: [
            'Decentralization level',
            'Transparency of development',
            'Community decision-making',
            'Code audit practices',
            'Regulatory compliance',
          ],
          weight: '33.4%',
        },
      },
      grading: {
        'A+ (95-100)': 'Exceptional ESG performance',
        'A (90-94)': 'Excellent ESG performance',
        'A- (85-89)': 'Very good ESG performance',
        'B+ (80-84)': 'Good ESG performance',
        'B (75-79)': 'Above average ESG performance',
        'B- (70-74)': 'Average ESG performance',
        'C+ (65-69)': 'Below average ESG performance',
        'C (60-64)': 'Poor ESG performance',
        'C- (55-59)': 'Very poor ESG performance',
        'D+ (50-54)': 'Concerning ESG performance',
        'D (40-49)': 'Alarming ESG performance',
        'D- (0-39)': 'Unacceptable ESG performance',
      },
      dataSources: [
        'Blockchain network data',
        'Academic research papers',
        'Project documentation',
        'Community governance records',
        'Environmental impact studies',
      ],
      limitations: [
        'ESG scores are based on available public information',
        'Cryptocurrency ESG assessment is an evolving field',
        'Scores may not reflect future changes in network parameters',
        'Environmental data may vary based on energy grid composition',
      ],
      lastUpdated: new Date().toISOString(),
    };
  }

  @Get('v2/score/:symbol')
  @ApiOperation({ summary: 'Get enhanced ESG score for an asset (v2)' })
  @ApiResponse({ status: 200, description: 'Enhanced ESG score retrieved successfully' })
  async getEnhancedEsgScore(@Param('symbol') symbol: string) {
    const esgData = await this.enhancedEsgService.getAssetESG(symbol);
    if (!esgData) {
      throw new NotFoundException(`ESG data not found for symbol: ${symbol}`);
    }
    return esgData;
  }

  @Get('v2/portfolio')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get enhanced portfolio ESG analysis (v2)' })
  @ApiResponse({
    status: 200,
    description: 'Enhanced portfolio ESG analysis retrieved successfully',
  })
  async getEnhancedPortfolioAnalysis(@CurrentUser() user: User) {
    return this.enhancedEsgService.getPortfolioESGAnalysis(user.id);
  }

  @Get('v2/spaces/:spaceId/portfolio')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get space-specific portfolio ESG analysis (v2)' })
  @ApiResponse({ status: 200, description: 'Space portfolio ESG analysis retrieved successfully' })
  async getSpacePortfolioAnalysis(@Param('spaceId') spaceId: string) {
    return this.enhancedEsgService.getSpacePortfolioESG(spaceId);
  }

  @Post('v2/compare')
  @ApiOperation({ summary: 'Compare enhanced ESG scores of multiple assets (v2)' })
  @ApiResponse({ status: 200, description: 'Enhanced ESG comparison completed successfully' })
  async compareEnhancedAssets(@Body('symbols') symbols: string[]) {
    if (!symbols || symbols.length === 0) {
      return { error: 'Please provide at least one symbol to compare' };
    }

    if (symbols.length > 20) {
      return { error: 'Maximum 20 symbols allowed for comparison' };
    }

    return this.enhancedEsgService.compareAssets(symbols);
  }

  @Get('v2/trends')
  @ApiOperation({ summary: 'Get enhanced ESG trends and insights (v2)' })
  @ApiResponse({ status: 200, description: 'Enhanced ESG trends retrieved successfully' })
  async getEnhancedTrends() {
    return this.enhancedEsgService.getESGTrends();
  }

  @Post('v2/refresh')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh ESG data for specified assets' })
  @ApiResponse({ status: 200, description: 'ESG data refresh completed' })
  async refreshEsgData(@Body('symbols') symbols: string[]) {
    if (!symbols || symbols.length === 0) {
      return { error: 'Please provide symbols to refresh' };
    }

    await this.enhancedEsgService.refreshESGData(symbols);
    return {
      success: true,
      message: `ESG data refresh initiated for ${symbols.length} assets`,
      symbols,
    };
  }

  @Get('v2/cache/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get ESG cache statistics' })
  @ApiResponse({ status: 200, description: 'Cache statistics retrieved' })
  async getCacheStats() {
    return this.enhancedEsgService.getCacheStats();
  }

  @Post('v2/cache/clear')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clear ESG cache' })
  @ApiResponse({ status: 200, description: 'Cache cleared successfully' })
  async clearCache() {
    await this.enhancedEsgService.clearESGCache();
    return { success: true, message: 'ESG cache cleared' };
  }
}
