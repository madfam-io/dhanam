import { User, UserProfile } from '@dhanam/shared';
import { Injectable, NotFoundException } from '@nestjs/common';

import { LoggerService } from '@core/logger/logger.service';
import { PrismaService } from '@core/prisma/prisma.service';

import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService
  ) {}

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userSpaces: {
          include: {
            space: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const spaces = user.userSpaces.map((us) => ({
      id: us.space.id,
      name: us.space.name,
      type: us.space.type,
      role: us.role,
    }));

    return {
      ...this.sanitizeUser(user),
      spaces,
    };
  }

  async updateProfile(userId: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        locale: dto.locale,
        timezone: dto.timezone,
      },
    });

    this.logger.log(`Profile updated for user: ${userId}`, 'UsersService');

    return this.sanitizeUser(user);
  }

  async deleteAccount(userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Delete user's spaces where they are the only owner
      const ownedSpaces = await tx.userSpace.findMany({
        where: {
          userId,
          role: 'owner',
        },
        include: {
          space: {
            include: {
              userSpaces: true,
            },
          },
        },
      });

      for (const userSpace of ownedSpaces) {
        const otherOwners = userSpace.space.userSpaces.filter(
          (us) => us.userId !== userId && us.role === 'owner'
        );

        if (otherOwners.length === 0) {
          await tx.space.delete({
            where: { id: userSpace.spaceId },
          });
        }
      }

      // Delete the user (cascades will handle related data)
      await tx.user.delete({
        where: { id: userId },
      });
    });

    this.logger.log(`Account deleted for user: ${userId}`, 'UsersService');
  }

  private sanitizeUser(user: any): User {
    const { passwordHash, totpSecret, ...sanitized } = user;
    return sanitized;
  }
}
