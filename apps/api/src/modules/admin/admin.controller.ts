import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';

import { AdminService } from './admin.service';
import {
  UserSearchDto,
  UserDetailsDto,
  SystemStatsDto,
  AuditLogSearchDto,
  OnboardingFunnelDto,
  FeatureFlagDto,
  UpdateFeatureFlagDto,
  PaginatedResponseDto,
} from './dto';
import { AdminGuard } from './guards/admin.guard';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'Search and list users with pagination' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Users retrieved successfully' })
  async searchUsers(@Query() dto: UserSearchDto): Promise<PaginatedResponseDto<any>> {
    return this.adminService.searchUsers(dto);
  }

  @Get('users/:userId')
  @ApiOperation({ summary: 'Get detailed user information (read-only)' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User details retrieved successfully',
    type: UserDetailsDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async getUserDetails(
    @Param('userId') userId: string,
    @Request() req: any
  ): Promise<UserDetailsDto> {
    return this.adminService.getUserDetails(userId, req.user.id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get system-wide statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'System stats retrieved successfully',
    type: SystemStatsDto,
  })
  async getSystemStats(): Promise<SystemStatsDto> {
    return this.adminService.getSystemStats();
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Search and view audit logs' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Audit logs retrieved successfully' })
  async searchAuditLogs(@Query() dto: AuditLogSearchDto): Promise<PaginatedResponseDto<any>> {
    return this.adminService.searchAuditLogs(dto);
  }

  @Get('analytics/onboarding-funnel')
  @ApiOperation({ summary: 'Get onboarding funnel analytics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Onboarding analytics retrieved successfully',
    type: OnboardingFunnelDto,
  })
  async getOnboardingFunnel(): Promise<OnboardingFunnelDto> {
    return this.adminService.getOnboardingFunnel();
  }

  @Get('feature-flags')
  @ApiOperation({ summary: 'List all feature flags' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Feature flags retrieved successfully',
    type: [FeatureFlagDto],
  })
  async getFeatureFlags(): Promise<FeatureFlagDto[]> {
    return this.adminService.getFeatureFlags();
  }

  @Get('feature-flags/:key')
  @ApiOperation({ summary: 'Get a specific feature flag' })
  @ApiParam({ name: 'key', description: 'Feature flag key' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Feature flag retrieved successfully',
    type: FeatureFlagDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Feature flag not found' })
  async getFeatureFlag(@Param('key') key: string): Promise<FeatureFlagDto> {
    const flag = await this.adminService.getFeatureFlag(key);
    if (!flag) {
      throw new NotFoundException('Feature flag not found');
    }
    return flag;
  }

  @Post('feature-flags/:key')
  @ApiOperation({ summary: 'Update a feature flag' })
  @ApiParam({ name: 'key', description: 'Feature flag key' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Feature flag updated successfully',
    type: FeatureFlagDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Feature flag not found' })
  async updateFeatureFlag(
    @Param('key') key: string,
    @Body() dto: UpdateFeatureFlagDto,
    @Request() req: any
  ): Promise<FeatureFlagDto> {
    return this.adminService.updateFeatureFlag(key, dto, req.user.id);
  }
}
