import {
  Controller,
  Get,
  Patch,
  Put,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { CurrentUser } from '@core/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';

import { UpdatePreferencesDto, PreferencesResponseDto, BulkPreferencesUpdateDto } from './dto';
import { PreferencesService } from './preferences.service';

@Controller('preferences')
@UseGuards(JwtAuthGuard)
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Get()
  async getUserPreferences(@CurrentUser('id') userId: string): Promise<PreferencesResponseDto> {
    return this.preferencesService.getUserPreferences(userId);
  }

  @Get('summary')
  async getPreferencesSummary(@CurrentUser('id') userId: string) {
    return this.preferencesService.getPreferencesSummary(userId);
  }

  @Patch()
  @HttpCode(HttpStatus.OK)
  async updatePreferences(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdatePreferencesDto
  ): Promise<PreferencesResponseDto> {
    return this.preferencesService.updateUserPreferences(userId, dto);
  }

  @Put('bulk')
  @HttpCode(HttpStatus.OK)
  async bulkUpdatePreferences(
    @CurrentUser('id') userId: string,
    @Body() dto: BulkPreferencesUpdateDto
  ): Promise<PreferencesResponseDto> {
    return this.preferencesService.bulkUpdatePreferences(userId, dto);
  }

  @Post('reset')
  @HttpCode(HttpStatus.OK)
  async resetPreferences(@CurrentUser('id') userId: string): Promise<PreferencesResponseDto> {
    return this.preferencesService.resetPreferences(userId);
  }
}
