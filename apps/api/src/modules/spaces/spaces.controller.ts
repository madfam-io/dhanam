import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { SpacesService } from './spaces.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SpaceGuard } from './guards/space.guard';
import { RequireRole } from './decorators/require-role.decorator';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { Space, SpaceMember } from '@dhanam/shared';

@ApiTags('Spaces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('spaces')
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}

  @Get()
  @ApiOperation({ summary: 'List user spaces' })
  @ApiResponse({ status: 200, description: 'List of spaces' })
  async listSpaces(@CurrentUser('id') userId: string): Promise<Space[]> {
    return this.spacesService.listUserSpaces(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create new space' })
  @ApiResponse({ status: 201, description: 'Space created' })
  async createSpace(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateSpaceDto,
  ): Promise<Space> {
    return this.spacesService.createSpace(userId, dto);
  }

  @Get(':spaceId')
  @UseGuards(SpaceGuard)
  @ApiOperation({ summary: 'Get space details' })
  @ApiResponse({ status: 200, description: 'Space details' })
  async getSpace(@Param('spaceId') spaceId: string): Promise<Space> {
    return this.spacesService.getSpace(spaceId);
  }

  @Patch(':spaceId')
  @UseGuards(SpaceGuard)
  @RequireRole('owner', 'admin')
  @ApiOperation({ summary: 'Update space' })
  @ApiResponse({ status: 200, description: 'Space updated' })
  async updateSpace(
    @Param('spaceId') spaceId: string,
    @Body() dto: UpdateSpaceDto,
  ): Promise<Space> {
    return this.spacesService.updateSpace(spaceId, dto);
  }

  @Delete(':spaceId')
  @UseGuards(SpaceGuard)
  @RequireRole('owner')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete space' })
  @ApiResponse({ status: 204, description: 'Space deleted' })
  async deleteSpace(@Param('spaceId') spaceId: string): Promise<void> {
    await this.spacesService.deleteSpace(spaceId);
  }

  @Get(':spaceId/members')
  @UseGuards(SpaceGuard)
  @ApiOperation({ summary: 'List space members' })
  @ApiResponse({ status: 200, description: 'List of members' })
  async listMembers(@Param('spaceId') spaceId: string): Promise<SpaceMember[]> {
    return this.spacesService.listMembers(spaceId);
  }

  @Post(':spaceId/members')
  @UseGuards(SpaceGuard)
  @RequireRole('owner', 'admin')
  @ApiOperation({ summary: 'Invite member to space' })
  @ApiResponse({ status: 201, description: 'Member invited' })
  async inviteMember(
    @Param('spaceId') spaceId: string,
    @Body() dto: InviteMemberDto,
  ): Promise<SpaceMember> {
    return this.spacesService.inviteMember(spaceId, dto);
  }

  @Patch(':spaceId/members/:userId')
  @UseGuards(SpaceGuard)
  @RequireRole('owner')
  @ApiOperation({ summary: 'Update member role' })
  @ApiResponse({ status: 200, description: 'Role updated' })
  async updateMemberRole(
    @Param('spaceId') spaceId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateMemberRoleDto,
  ): Promise<SpaceMember> {
    return this.spacesService.updateMemberRole(spaceId, userId, dto);
  }

  @Delete(':spaceId/members/:userId')
  @UseGuards(SpaceGuard)
  @RequireRole('owner', 'admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove member from space' })
  @ApiResponse({ status: 204, description: 'Member removed' })
  async removeMember(
    @Param('spaceId') spaceId: string,
    @Param('userId') userId: string,
    @CurrentUser('id') currentUserId: string,
  ): Promise<void> {
    await this.spacesService.removeMember(spaceId, userId, currentUserId);
  }
}