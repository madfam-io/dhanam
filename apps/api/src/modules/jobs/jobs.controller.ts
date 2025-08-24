import { Controller, Post, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { CurrentUser, AuthenticatedUser } from '@core/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { SpaceGuard } from '@modules/spaces/guards/space.guard';

import { JobsService } from './jobs.service';

@ApiTags('jobs')
@Controller('jobs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post('categorize/:spaceId')
  @UseGuards(SpaceGuard)
  @ApiOperation({ summary: 'Manually trigger transaction categorization for a space' })
  async triggerCategorization(@Param('spaceId') spaceId: string) {
    const result = await this.jobsService.triggerCategorization(spaceId);
    return {
      message: `Categorized ${result.categorized} out of ${result.total} transactions`,
      ...result,
    };
  }

  @Post('categorize')
  @ApiOperation({ summary: 'Manually trigger transaction categorization for all spaces' })
  async triggerGlobalCategorization() {
    const result = await this.jobsService.triggerCategorization();
    return {
      message: `Categorized ${result.categorized} out of ${result.total} transactions across ${result.spaces} spaces`,
      ...result,
    };
  }

  @Post('sync-portfolio')
  @ApiOperation({ summary: 'Manually trigger portfolio sync for current user' })
  async triggerPortfolioSync(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.jobsService.triggerPortfolioSync(user.userId);
    return {
      message: `Portfolio sync completed with ${result.errors} errors`,
      ...result,
    };
  }

  @Post('sync-portfolio/all')
  @ApiOperation({ summary: 'Manually trigger portfolio sync for all users (admin only)' })
  async triggerGlobalPortfolioSync() {
    const result = await this.jobsService.triggerPortfolioSync();
    return {
      message: `Portfolio sync completed for ${result.syncedUsers} users with ${result.errors} errors`,
      ...result,
    };
  }
}
