import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiParam,
} from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { SubscriptionStatus } from '@db';

import { CreateSubscriptionDto, UpdateSubscriptionDto, CancelSubscriptionDto } from './dto';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('Subscriptions')
@Controller('spaces/:spaceId/subscriptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
@ApiForbiddenResponse({ description: 'User lacks access to this space' })
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all subscriptions in a space' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'trial', 'paused', 'cancelled', 'expired'],
  })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiOkResponse({ description: 'List of subscriptions' })
  findAll(
    @Param('spaceId') spaceId: string,
    @Query('status') status?: SubscriptionStatus,
    @Query('category') category?: string,
    @Req() req?: Request
  ) {
    return this.subscriptionsService.findAll(spaceId, req!.user!.id, {
      status,
      category,
    });
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get subscription spending summary' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiOkResponse({ description: 'Subscription spending summary' })
  getSummary(@Param('spaceId') spaceId: string, @Req() req: Request) {
    return this.subscriptionsService.getSummary(spaceId, req.user!.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a subscription by id' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiParam({ name: 'id', description: 'Subscription UUID' })
  @ApiOkResponse({ description: 'Subscription details' })
  @ApiNotFoundResponse({ description: 'Subscription not found' })
  findOne(@Param('spaceId') spaceId: string, @Param('id') id: string, @Req() req: Request) {
    return this.subscriptionsService.findOne(spaceId, req.user!.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new subscription' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiOkResponse({ description: 'Subscription created successfully' })
  @ApiBadRequestResponse({ description: 'Invalid subscription data' })
  create(
    @Param('spaceId') spaceId: string,
    @Body() dto: CreateSubscriptionDto,
    @Req() req: Request
  ) {
    return this.subscriptionsService.create(spaceId, req.user!.id, dto);
  }

  @Post('detect')
  @ApiOperation({ summary: 'Detect subscriptions from recurring transactions' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiOkResponse({ description: 'Detected subscriptions' })
  detect(@Param('spaceId') spaceId: string, @Req() req: Request) {
    return this.subscriptionsService.detectAndCreate(spaceId, req.user!.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a subscription' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiParam({ name: 'id', description: 'Subscription UUID' })
  @ApiOkResponse({ description: 'Subscription updated successfully' })
  @ApiNotFoundResponse({ description: 'Subscription not found' })
  @ApiBadRequestResponse({ description: 'Invalid update data' })
  update(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionDto,
    @Req() req: Request
  ) {
    return this.subscriptionsService.update(spaceId, req.user!.id, id, dto);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a subscription' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiParam({ name: 'id', description: 'Subscription UUID' })
  @ApiOkResponse({ description: 'Subscription cancelled successfully' })
  @ApiNotFoundResponse({ description: 'Subscription not found' })
  cancel(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Body() dto: CancelSubscriptionDto,
    @Req() req: Request
  ) {
    return this.subscriptionsService.cancel(spaceId, req.user!.id, id, dto);
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause a subscription' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiParam({ name: 'id', description: 'Subscription UUID' })
  @ApiOkResponse({ description: 'Subscription paused successfully' })
  @ApiNotFoundResponse({ description: 'Subscription not found' })
  pause(@Param('spaceId') spaceId: string, @Param('id') id: string, @Req() req: Request) {
    return this.subscriptionsService.pause(spaceId, req.user!.id, id);
  }

  @Post(':id/resume')
  @ApiOperation({ summary: 'Resume a paused subscription' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiParam({ name: 'id', description: 'Subscription UUID' })
  @ApiOkResponse({ description: 'Subscription resumed successfully' })
  @ApiNotFoundResponse({ description: 'Subscription not found' })
  resume(@Param('spaceId') spaceId: string, @Param('id') id: string, @Req() req: Request) {
    return this.subscriptionsService.resume(spaceId, req.user!.id, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a subscription' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiParam({ name: 'id', description: 'Subscription UUID' })
  @ApiOkResponse({ description: 'Subscription deleted successfully' })
  @ApiNotFoundResponse({ description: 'Subscription not found' })
  remove(@Param('spaceId') spaceId: string, @Param('id') id: string, @Req() req: Request) {
    return this.subscriptionsService.remove(spaceId, req.user!.id, id);
  }
}
