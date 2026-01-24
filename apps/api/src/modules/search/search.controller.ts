import { Controller, Get, Query, UseGuards, Param, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';

import { NaturalLanguageService } from './natural-language.service';

@ApiTags('search')
@Controller('spaces/:spaceId/search')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SearchController {
  constructor(private readonly nlService: NaturalLanguageService) {}

  @Get()
  @ApiOperation({ summary: 'Search transactions using natural language' })
  @ApiQuery({ name: 'q', required: true, description: 'Natural language query' })
  async search(@Param('spaceId') spaceId: string, @Query('q') query: string, @Req() req: Request) {
    return this.nlService.search(spaceId, req.user!.id, query);
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get search suggestions' })
  @ApiQuery({ name: 'q', required: false, description: 'Partial query for suggestions' })
  async getSuggestions(
    @Param('spaceId') spaceId: string,
    @Query('q') query?: string,
    @Req() req?: Request
  ) {
    return this.nlService.getSuggestions(spaceId, req!.user!.id, query || '');
  }
}
