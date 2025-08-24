import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Post,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { EsgService } from './esg.service';
import { CurrentUser } from '@core/auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('ESG Scoring')
@Controller('esg')
export class EsgController {
  constructor(private readonly esgService: EsgService) {}

  @Get('score/:symbol')
  @ApiOperation({ summary: 'Get ESG score for an asset' })
  @ApiResponse({ status: 200, description: 'ESG score retrieved successfully' })
  @ApiQuery({ name: 'assetType', required: false, enum: ['crypto', 'equity', 'etf'] })
  async getEsgScore(
    @Param('symbol') symbol: string,
    @Query('assetType') assetType = 'crypto',
  ) {
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
  async compareAssets(
    @Body('symbols') symbols: string[],
  ) {
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
      description: 'Comprehensive ESG scoring for digital assets with focus on environmental impact, social value, and governance quality',
      scoring: {
        environmental: {
          description: 'Energy efficiency, carbon footprint, consensus mechanism sustainability',
          factors: [
            'Energy consumption per transaction',
            'Carbon emissions',
            'Consensus mechanism efficiency',
            'Renewable energy usage',
            'Environmental commitments'
          ],
          weight: '33.3%'
        },
        social: {
          description: 'Financial inclusion, accessibility, community development',
          factors: [
            'Financial inclusion potential',
            'Transaction accessibility',
            'Community governance',
            'Developer ecosystem',
            'Educational initiatives'
          ],
          weight: '33.3%'
        },
        governance: {
          description: 'Decentralization, transparency, decision-making processes',
          factors: [
            'Decentralization level',
            'Transparency of development',
            'Community decision-making',
            'Code audit practices',
            'Regulatory compliance'
          ],
          weight: '33.4%'
        }
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
        'D- (0-39)': 'Unacceptable ESG performance'
      },
      dataSources: [
        'Blockchain network data',
        'Academic research papers',
        'Project documentation',
        'Community governance records',
        'Environmental impact studies'
      ],
      limitations: [
        'ESG scores are based on available public information',
        'Cryptocurrency ESG assessment is an evolving field',
        'Scores may not reflect future changes in network parameters',
        'Environmental data may vary based on energy grid composition'
      ],
      lastUpdated: new Date().toISOString()
    };
  }
}