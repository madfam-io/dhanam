import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { CryptoService } from '@core/crypto/crypto.service';
import { LoggerService } from '@core/logger/logger.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { ConnectAccountDto } from './dto/connect-account.dto';
import { Account, SyncAccountResponse, AccountType } from '@dhanam/shared';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AccountsService {
  constructor(
    private prisma: PrismaService,
    private crypto: CryptoService,
    private logger: LoggerService,
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
    spaceId: string,
    userId: string,
    dto: ConnectAccountDto,
  ): Promise<Account[]> {
    // This is a placeholder for provider integration
    // In production, this would call the appropriate provider service
    
    if (!['belvo', 'plaid', 'bitso'].includes(dto.provider)) {
      throw new BadRequestException('Invalid provider');
    }

    // For now, create a mock connected account
    const mockAccount = await this.prisma.account.create({
      data: {
        spaceId,
        provider: dto.provider,
        providerAccountId: `mock_${uuidv4()}`,
        name: `${dto.provider} Account`,
        type: 'checking',
        currency: dto.provider === 'belvo' ? 'MXN' : 'USD',
        balance: 0,
        encryptedCredentials: {},
      },
    });

    this.logger.log(
      `Account connected via ${dto.provider}: ${mockAccount.id}`,
      'AccountsService'
    );

    return [this.sanitizeAccount(mockAccount)];
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

  async updateAccount(
    spaceId: string,
    accountId: string,
    dto: UpdateAccountDto,
  ): Promise<Account> {
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
    const { encryptedCredentials, ...sanitized } = account;
    return {
      ...sanitized,
      balance: parseFloat(account.balance.toString()),
    };
  }
}