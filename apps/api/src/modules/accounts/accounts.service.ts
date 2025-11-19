import { Account, SyncAccountResponse, AccountType } from '@dhanam/shared';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { LoggerService } from '@core/logger/logger.service';
import { PrismaService } from '@core/prisma/prisma.service';

import { ConnectAccountDto } from './dto/connect-account.dto';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService
  ) {}

  async listAccounts(spaceId: string, type?: string): Promise<Account[]> {
    const accounts = await this.prisma.account.findMany({
      where: {
        spaceId,
        ...(type && { type: type as AccountType }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return accounts.map(this.sanitizeAccount);
  }

  async createAccount(spaceId: string, dto: CreateAccountDto): Promise<Account> {
    const account = await this.prisma.account.create({
      data: {
        spaceId,
        name: dto.name,
        type: dto.type,
        subtype: dto.subtype,
        currency: dto.currency,
        balance: dto.balance,
        provider: 'manual',
      },
    });

    this.logger.log(
      `Manual account created: ${account.id} in space: ${spaceId}`,
      'AccountsService'
    );

    return this.sanitizeAccount(account);
  }

  async connectAccount(
    _spaceId: string,
    _userId: string,
    dto: ConnectAccountDto
  ): Promise<Account[]> {
    // This is a placeholder for provider integration
    // In production, this would call the appropriate provider service

    if (!['belvo', 'plaid', 'bitso'].includes(dto.provider)) {
      throw new BadRequestException('Invalid provider');
    }

    // Route to appropriate provider
    switch (dto.provider) {
      case 'belvo':
        // For Belvo, we'll need to handle this through the Belvo module
        throw new BadRequestException(
          'Belvo connections should be initiated through /providers/belvo/link endpoint'
        );
      case 'plaid':
        // TODO: Implement Plaid integration
        throw new BadRequestException('Plaid integration not yet implemented');
      case 'bitso':
        // TODO: Implement Bitso integration
        throw new BadRequestException('Bitso integration not yet implemented');
      default:
        throw new BadRequestException(`Unknown provider: ${dto.provider}`);
    }
  }

  async getAccount(spaceId: string, accountId: string): Promise<Account> {
    const account = await this.prisma.account.findFirst({
      where: {
        id: accountId,
        spaceId,
      },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return this.sanitizeAccount(account);
  }

  async updateAccount(spaceId: string, accountId: string, dto: UpdateAccountDto): Promise<Account> {
    const account = await this.prisma.account.findFirst({
      where: {
        id: accountId,
        spaceId,
      },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    if (account.provider !== 'manual' && dto.balance !== undefined) {
      throw new BadRequestException('Cannot manually update balance for connected accounts');
    }

    const updated = await this.prisma.account.update({
      where: { id: accountId },
      data: {
        name: dto.name,
        balance: dto.balance,
      },
    });

    this.logger.log(`Account updated: ${accountId}`, 'AccountsService');

    return this.sanitizeAccount(updated);
  }

  async deleteAccount(spaceId: string, accountId: string): Promise<void> {
    const account = await this.prisma.account.findFirst({
      where: {
        id: accountId,
        spaceId,
      },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    await this.prisma.account.delete({
      where: { id: accountId },
    });

    this.logger.log(`Account deleted: ${accountId}`, 'AccountsService');
  }

  async syncAccount(spaceId: string, accountId: string): Promise<SyncAccountResponse> {
    const account = await this.prisma.account.findFirst({
      where: {
        id: accountId,
        spaceId,
      },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    if (account.provider === 'manual') {
      throw new BadRequestException('Cannot sync manual accounts');
    }

    // This is a placeholder for the actual sync process
    // In production, this would trigger a background job
    const jobId = uuidv4();

    await this.prisma.account.update({
      where: { id: accountId },
      data: {
        lastSyncedAt: new Date(),
      },
    });

    this.logger.log(`Account sync initiated: ${accountId}, job: ${jobId}`, 'AccountsService');

    return {
      jobId,
      status: 'pending',
    };
  }

  private sanitizeAccount(account: any): Account {
    const { encryptedCredentials: _encryptedCredentials, ...sanitized } = account;
    return {
      ...sanitized,
      balance: parseFloat(account.balance.toString()),
    };
  }
}
