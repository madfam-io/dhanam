import { Account, SyncAccountResponse } from '@dhanam/shared';
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';

import { RequireRole } from '../spaces/decorators/require-role.decorator';
import { SpaceGuard } from '../spaces/guards/space.guard';

import { AccountsService } from './accounts.service';
import { ConnectAccountDto } from './dto/connect-account.dto';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@ApiTags('Accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('spaces/:spaceId/accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  @UseGuards(SpaceGuard)
  @ApiOperation({ summary: 'List accounts in space' })
  @ApiResponse({ status: 200, description: 'List of accounts' })
  async listAccounts(
    @Param('spaceId') spaceId: string,
    @Query('type') type?: string
  ): Promise<Account[]> {
    return this.accountsService.listAccounts(spaceId, type);
  }

  @Post()
  @UseGuards(SpaceGuard)
  @RequireRole('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Add manual account' })
  @ApiResponse({ status: 201, description: 'Account created' })
  async createAccount(
    @Param('spaceId') spaceId: string,
    @Body() dto: CreateAccountDto
  ): Promise<Account> {
    return this.accountsService.createAccount(spaceId, dto);
  }

  @Post('connect')
  @UseGuards(SpaceGuard)
  @RequireRole('owner', 'admin')
  @ApiOperation({ summary: 'Connect external account' })
  @ApiResponse({ status: 201, description: 'Account connected' })
  async connectAccount(
    @Param('spaceId') spaceId: string,
    @Body() dto: ConnectAccountDto,
    @Req() req: any
  ): Promise<Account[]> {
    const userId = req.user!.id;
    return this.accountsService.connectAccount(spaceId, userId, dto);
  }

  @Get(':accountId')
  @UseGuards(SpaceGuard)
  @ApiOperation({ summary: 'Get account details' })
  @ApiResponse({ status: 200, description: 'Account details' })
  async getAccount(
    @Param('spaceId') spaceId: string,
    @Param('accountId') accountId: string
  ): Promise<Account> {
    return this.accountsService.getAccount(spaceId, accountId);
  }

  @Patch(':accountId')
  @UseGuards(SpaceGuard)
  @RequireRole('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Update account' })
  @ApiResponse({ status: 200, description: 'Account updated' })
  async updateAccount(
    @Param('spaceId') spaceId: string,
    @Param('accountId') accountId: string,
    @Body() dto: UpdateAccountDto
  ): Promise<Account> {
    return this.accountsService.updateAccount(spaceId, accountId, dto);
  }

  @Delete(':accountId')
  @UseGuards(SpaceGuard)
  @RequireRole('owner', 'admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete account' })
  @ApiResponse({ status: 204, description: 'Account deleted' })
  async deleteAccount(
    @Param('spaceId') spaceId: string,
    @Param('accountId') accountId: string
  ): Promise<void> {
    await this.accountsService.deleteAccount(spaceId, accountId);
  }

  @Post(':accountId/sync')
  @UseGuards(SpaceGuard)
  @ApiOperation({ summary: 'Sync account data' })
  @ApiResponse({ status: 200, description: 'Sync initiated' })
  async syncAccount(
    @Param('spaceId') spaceId: string,
    @Param('accountId') accountId: string
  ): Promise<SyncAccountResponse> {
    return this.accountsService.syncAccount(spaceId, accountId);
  }
}
