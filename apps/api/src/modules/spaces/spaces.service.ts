import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { LoggerService } from '@core/logger/logger.service';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { Space, SpaceMember, SpaceRole } from '@dhanam/shared';

@Injectable()
export class SpacesService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  async listUserSpaces(userId: string): Promise<Space[]> {
    const userSpaces = await this.prisma.userSpace.findMany({
      where: { userId },
      include: { space: true },
    });

    return userSpaces.map((us) => ({
      ...us.space,
      role: us.role,
    }));
  }

  async createSpace(userId: string, dto: CreateSpaceDto): Promise<Space> {
    const space = await this.prisma.space.create({
      data: {
        name: dto.name,
        type: dto.type,
        currency: dto.currency || 'MXN',
        userSpaces: {
          create: {
            userId,
            role: 'owner',
          },
        },
      },
    });

    this.logger.log(`Space created: ${space.id} by user: ${userId}`, 'SpacesService');

    return {
      ...space,
      role: 'owner' as SpaceRole,
    };
  }

  async getSpace(spaceId: string): Promise<Space> {
    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
    });

    if (!space) {
      throw new NotFoundException('Space not found');
    }

    return space;
  }

  async updateSpace(spaceId: string, dto: UpdateSpaceDto): Promise<Space> {
    const space = await this.prisma.space.update({
      where: { id: spaceId },
      data: {
        name: dto.name,
        currency: dto.currency,
      },
    });

    this.logger.log(`Space updated: ${spaceId}`, 'SpacesService');

    return space;
  }

  async deleteSpace(spaceId: string): Promise<void> {
    await this.prisma.space.delete({
      where: { id: spaceId },
    });

    this.logger.log(`Space deleted: ${spaceId}`, 'SpacesService');
  }

  async listMembers(spaceId: string): Promise<SpaceMember[]> {
    const members = await this.prisma.userSpace.findMany({
      where: { spaceId },
      include: { user: true },
    });

    return members.map((member) => ({
      userId: member.userId,
      email: member.user.email,
      name: member.user.name,
      role: member.role,
      joinedAt: member.createdAt.toISOString(),
    }));
  }

  async inviteMember(spaceId: string, dto: InviteMemberDto): Promise<SpaceMember> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingMember = await this.prisma.userSpace.findUnique({
      where: {
        userId_spaceId: {
          userId: user.id,
          spaceId,
        },
      },
    });

    if (existingMember) {
      throw new BadRequestException('User is already a member');
    }

    const userSpace = await this.prisma.userSpace.create({
      data: {
        userId: user.id,
        spaceId,
        role: dto.role,
      },
      include: { user: true },
    });

    this.logger.log(
      `Member invited: ${user.id} to space: ${spaceId} with role: ${dto.role}`,
      'SpacesService'
    );

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: userSpace.role,
      joinedAt: userSpace.createdAt.toISOString(),
    };
  }

  async updateMemberRole(
    spaceId: string,
    userId: string,
    dto: UpdateMemberRoleDto,
  ): Promise<SpaceMember> {
    const member = await this.prisma.userSpace.findUnique({
      where: {
        userId_spaceId: { userId, spaceId },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.role === 'owner' && dto.role !== 'owner') {
      const ownerCount = await this.prisma.userSpace.count({
        where: { spaceId, role: 'owner' },
      });

      if (ownerCount === 1) {
        throw new BadRequestException('Space must have at least one owner');
      }
    }

    const updated = await this.prisma.userSpace.update({
      where: {
        userId_spaceId: { userId, spaceId },
      },
      data: { role: dto.role },
      include: { user: true },
    });

    this.logger.log(
      `Member role updated: ${userId} in space: ${spaceId} to role: ${dto.role}`,
      'SpacesService'
    );

    return {
      userId: updated.user.id,
      email: updated.user.email,
      name: updated.user.name,
      role: updated.role,
      joinedAt: updated.createdAt.toISOString(),
    };
  }

  async removeMember(
    spaceId: string,
    userId: string,
    currentUserId: string,
  ): Promise<void> {
    if (userId === currentUserId) {
      throw new BadRequestException('Cannot remove yourself');
    }

    const member = await this.prisma.userSpace.findUnique({
      where: {
        userId_spaceId: { userId, spaceId },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.role === 'owner') {
      const ownerCount = await this.prisma.userSpace.count({
        where: { spaceId, role: 'owner' },
      });

      if (ownerCount === 1) {
        throw new BadRequestException('Cannot remove the only owner');
      }
    }

    await this.prisma.userSpace.delete({
      where: {
        userId_spaceId: { userId, spaceId },
      },
    });

    this.logger.log(`Member removed: ${userId} from space: ${spaceId}`, 'SpacesService');
  }

  async getUserRoleInSpace(userId: string, spaceId: string): Promise<SpaceRole | null> {
    const userSpace = await this.prisma.userSpace.findUnique({
      where: {
        userId_spaceId: { userId, spaceId },
      },
    });

    return userSpace?.role || null;
  }
}