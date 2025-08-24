import { User } from '@dhanam/shared';
import { Controller, Get, Post, Put, Body, Param, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { CurrentUser } from '@core/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';

import {
  UpdateOnboardingStepDto,
  CompleteOnboardingDto,
  UpdatePreferencesDto,
  VerifyEmailDto,
  OnboardingStatusDto,
  OnboardingStep,
} from './dto';
import { OnboardingService } from './onboarding.service';

@ApiTags('Onboarding')
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user onboarding status and progress' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Onboarding status retrieved successfully',
    type: OnboardingStatusDto,
  })
  async getOnboardingStatus(@CurrentUser() user: User): Promise<OnboardingStatusDto> {
    return await this.onboardingService.getOnboardingStatus(user.id);
  }

  @Put('step')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current onboarding step' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Onboarding step updated successfully',
    type: OnboardingStatusDto,
  })
  async updateOnboardingStep(
    @CurrentUser() user: User,
    @Body() dto: UpdateOnboardingStepDto
  ): Promise<OnboardingStatusDto> {
    return await this.onboardingService.updateOnboardingStep(user.id, dto);
  }

  @Post('complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark onboarding as completed' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Onboarding completed successfully',
    type: OnboardingStatusDto,
  })
  async completeOnboarding(
    @CurrentUser() user: User,
    @Body() dto: CompleteOnboardingDto
  ): Promise<OnboardingStatusDto> {
    return await this.onboardingService.completeOnboarding(user.id, dto);
  }

  @Put('preferences')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user preferences during onboarding' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Preferences updated successfully',
  })
  async updatePreferences(
    @CurrentUser() user: User,
    @Body() dto: UpdatePreferencesDto
  ): Promise<{ success: boolean }> {
    return await this.onboardingService.updatePreferences(user.id, dto);
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify user email address' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email verified successfully',
  })
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<{ success: boolean; message: string }> {
    return await this.onboardingService.verifyEmail(dto);
  }

  @Post('resend-verification')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resend email verification' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verification email sent',
  })
  async resendEmailVerification(
    @CurrentUser() user: User
  ): Promise<{ success: boolean; message: string }> {
    return await this.onboardingService.sendEmailVerification(user.id);
  }

  @Post('skip/:step')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Skip an optional onboarding step' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Step skipped successfully',
    type: OnboardingStatusDto,
  })
  async skipOnboardingStep(
    @CurrentUser() user: User,
    @Param('step') step: OnboardingStep
  ): Promise<OnboardingStatusDto> {
    return await this.onboardingService.skipOnboardingStep(user.id, step);
  }

  @Post('reset')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reset onboarding progress (for testing/support)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Onboarding reset successfully',
    type: OnboardingStatusDto,
  })
  async resetOnboarding(@CurrentUser() user: User): Promise<OnboardingStatusDto> {
    return await this.onboardingService.resetOnboarding(user.id);
  }

  @Get('health')
  @ApiOperation({ summary: 'Check onboarding service health' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Service health status' })
  getHealth() {
    return {
      service: 'onboarding',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      features: {
        stepTracking: true,
        emailVerification: true,
        progressTracking: true,
        preferenceManagement: true,
      },
    };
  }
}
