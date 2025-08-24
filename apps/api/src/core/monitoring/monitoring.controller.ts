import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';

import { HealthService } from './health.service';
import { MetricsService } from './metrics.service';

@ApiTags('Monitoring')
@Controller('monitoring')
export class MonitoringController {
  constructor(
    private readonly healthService: HealthService,
    private readonly metricsService: MetricsService
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Get system health status' })
  @ApiResponse({ status: 200, description: 'Health status retrieved successfully' })
  async getHealth() {
    return this.healthService.getHealthStatus();
  }

  @Get('health/readiness')
  @ApiOperation({ summary: 'Get system readiness status for load balancer' })
  @ApiResponse({ status: 200, description: 'Readiness status retrieved successfully' })
  async getReadiness() {
    return this.healthService.getReadinessStatus();
  }

  @Get('health/liveness')
  @ApiOperation({ summary: 'Get system liveness status for load balancer' })
  @ApiResponse({ status: 200, description: 'Liveness status retrieved successfully' })
  async getLiveness() {
    return this.healthService.getLivenessStatus();
  }

  @Get('metrics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get system metrics (admin only)' })
  @ApiResponse({ status: 200, description: 'Metrics retrieved successfully' })
  async getMetrics() {
    return this.metricsService.getSystemMetrics();
  }

  @Get('metrics/resources')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get resource usage metrics (admin only)' })
  @ApiResponse({ status: 200, description: 'Resource metrics retrieved successfully' })
  getResourceMetrics() {
    return this.metricsService.getResourceMetrics();
  }
}
