import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CryptoService } from '../../../core/crypto/crypto.service';
import { ConnectBitsoDto, BitsoWebhookDto } from './dto';
import { Account } from '@dhanam/shared';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';
import axios, { AxiosInstance } from 'axios';

interface BitsoBalance {
  currency: string;
  available: string;
  locked: string;
  total: string;
}

interface BitsoTrade {
  tid: number;
  oid: string;
  symbol: string;
  side: 'buy' | 'sell';
  amount: string;
  price: string;
  fees_amount: string;
  fees_currency: string;
  created_at: string;
}

interface BitsoTicker {
  book: string;
  volume: string;
  high: string;
  last: string;
  low: string;
  vwap: string;
  ask: string;
  bid: string;
  created_at: string;
}

@Injectable()
export class BitsoService {
  private readonly logger = new Logger(BitsoService.name);
  private bitsoClient: AxiosInstance | null = null;
  private readonly webhookSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly cryptoService: CryptoService,
  ) {
    this.initializeBitsoClient();
    this.webhookSecret = this.configService.get('BITSO_WEBHOOK_SECRET', '');
  }

  private initializeBitsoClient() {
    const apiKey = this.configService.get('BITSO_API_KEY');
    const apiSecret = this.configService.get('BITSO_API_SECRET');

    if (!apiKey || !apiSecret) {
      this.logger.warn('Bitso credentials not configured, service disabled');
      return;
    }

    this.bitsoClient = axios.create({
      baseURL: 'https://api.bitso.com/v3',
      timeout: 10000,
    });

    // Add request interceptor for authentication
    this.bitsoClient.interceptors.request.use((config) => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const method = config.method?.toUpperCase() || 'GET';
      const requestPath = config.url || '';
      const body = config.data ? JSON.stringify(config.data) : '';
      
      const message = timestamp + method + '/v3' + requestPath + body;
      const signature = crypto
        .createHmac('sha256', apiSecret)
        .update(message)
        .digest('hex');

      config.headers = {
        ...config.headers,
        'Authorization': `Bitso ${apiKey}:${timestamp}:${signature}`,
        'Content-Type': 'application/json',
      };

      return config;
    });

    this.logger.log('Bitso client initialized successfully');
  }

  async connectAccount(
    spaceId: string,
    userId: string,
    dto: ConnectBitsoDto,
  ): Promise<{ accounts: Account[]; message: string }> {
    try {
      // Create temporary client with provided credentials
      const tempClient = this.createTempClient(dto.apiKey, dto.apiSecret);
      
      // Verify credentials by fetching account info
      const accountInfoResponse = await tempClient.get('/account_status');
      const accountInfo = accountInfoResponse.data.payload;
      
      if (!accountInfo) {
        throw new BadRequestException('Invalid Bitso API credentials');
      }

      // Store encrypted credentials
      const encryptedApiKey = await this.cryptoService.encrypt(dto.apiKey);
      const encryptedApiSecret = await this.cryptoService.encrypt(dto.apiSecret);
      
      await this.prisma.providerConnection.create({
        data: {
          provider: 'bitso',
          providerUserId: accountInfo.client_id || crypto.randomUUID(),
          encryptedToken: encryptedApiKey,
          metadata: {
            encryptedApiSecret,
            externalId: dto.externalId,
            autoSync: dto.autoSync ?? true,
            connectedAt: new Date().toISOString(),
            accountStatus: accountInfo.status,
            dailyLimit: accountInfo.daily_limit,
            monthlyLimit: accountInfo.monthly_limit,
          } as Prisma.JsonObject,
          user: { connect: { id: userId } },
        },
      });

      // Fetch and create crypto accounts
      const accounts = await this.syncBalances(spaceId, tempClient, accountInfo.client_id);

      // Initial trades sync for transaction history
      await this.syncTrades(tempClient, accountInfo.client_id);

      this.logger.log(`Successfully connected Bitso account for user ${userId}`);
      return {
        accounts,
        message: `Successfully connected Bitso account with ${accounts.length} crypto holdings`,
      };
    } catch (error) {
      this.logger.error('Failed to connect Bitso account:', error);
      if (error.response?.status === 401) {
        throw new BadRequestException('Invalid Bitso API credentials');
      }
      throw new BadRequestException('Failed to connect Bitso account');
    }
  }

  private createTempClient(apiKey: string, apiSecret: string): AxiosInstance {
    const client = axios.create({
      baseURL: 'https://api.bitso.com/v3',
      timeout: 10000,
    });

    client.interceptors.request.use((config) => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const method = config.method?.toUpperCase() || 'GET';
      const requestPath = config.url || '';
      const body = config.data ? JSON.stringify(config.data) : '';
      
      const message = timestamp + method + '/v3' + requestPath + body;
      const signature = crypto
        .createHmac('sha256', apiSecret)
        .update(message)
        .digest('hex');

      config.headers = {
        ...config.headers,
        'Authorization': `Bitso ${apiKey}:${timestamp}:${signature}`,
        'Content-Type': 'application/json',
      };

      return config;
    });

    return client;
  }

  private async syncBalances(
    spaceId: string,
    client: AxiosInstance,
    clientId: string,
  ): Promise<Account[]> {
    try {
      const balancesResponse = await client.get('/balance');
      const balances: BitsoBalance[] = balancesResponse.data.payload.balances;
      
      const accounts: Account[] = [];
      
      // Get current crypto prices for valuation
      const tickerResponse = await axios.get('https://api.bitso.com/v3/ticker');
      const tickers: BitsoTicker[] = tickerResponse.data.payload;
      const priceMap = this.createPriceMap(tickers);

      for (const balance of balances) {
        const totalAmount = parseFloat(balance.total);
        
        // Skip zero balances
        if (totalAmount <= 0) continue;

        // Calculate USD value
        const usdPrice = priceMap[`${balance.currency.toLowerCase()}_mxn`] || 0;
        const mxnToUsdRate = priceMap['usd_mxn'] ? 1 / priceMap['usd_mxn'] : 0.05; // Fallback rate
        const usdValue = usdPrice * mxnToUsdRate * totalAmount;

        const accountData = {
          spaceId,
          provider: 'bitso' as const,
          providerAccountId: `bitso_${balance.currency.toLowerCase()}_${clientId}`,
          name: `${balance.currency.toUpperCase()} Wallet`,
          type: 'crypto' as const,
          subtype: 'crypto',
          currency: 'USD', // Normalize to USD for portfolio tracking
          balance: Math.round(usdValue * 100) / 100, // Round to 2 decimals
          lastSyncedAt: new Date(),
          metadata: {
            cryptoCurrency: balance.currency.toUpperCase(),
            cryptoAmount: totalAmount,
            availableAmount: parseFloat(balance.available),
            lockedAmount: parseFloat(balance.locked),
            usdPrice: usdPrice * mxnToUsdRate,
            lastPriceUpdate: new Date().toISOString(),
            clientId,
          } as Prisma.JsonObject,
        };

        const account = await this.prisma.account.create({ data: accountData });
        accounts.push(account as Account);
      }

      return accounts;
    } catch (error) {
      this.logger.error('Failed to sync Bitso balances:', error);
      throw error;
    }
  }

  private createPriceMap(tickers: BitsoTicker[]): Record<string, number> {
    const priceMap: Record<string, number> = {};
    
    for (const ticker of tickers) {
      priceMap[ticker.book] = parseFloat(ticker.last);
    }
    
    return priceMap;
  }

  private async syncTrades(client: AxiosInstance, clientId: string) {
    try {
      const tradesResponse = await client.get('/user_trades', {
        params: { limit: 100 } // Get last 100 trades
      });
      const trades: BitsoTrade[] = tradesResponse.data.payload;

      for (const trade of trades) {
        await this.createTransactionFromTrade(trade, clientId);
      }

      this.logger.log(`Synced ${trades.length} trades for client ${clientId}`);
    } catch (error) {
      this.logger.error(`Failed to sync trades for client ${clientId}:`, error);
    }
  }

  private async createTransactionFromTrade(trade: BitsoTrade, clientId: string) {
    try {
      // Find the crypto account
      const [baseCurrency] = trade.symbol.split('_');
      const account = await this.prisma.account.findFirst({
        where: {
          provider: 'bitso',
          providerAccountId: `bitso_${baseCurrency.toLowerCase()}_${clientId}`,
        },
      });

      if (!account) {
        this.logger.warn(`Account not found for trade ${trade.tid}`);
        return;
      }

      // Calculate transaction amount (positive for buy, negative for sell)
      const amount = trade.side === 'buy' 
        ? parseFloat(trade.amount) 
        : -parseFloat(trade.amount);

      // Create transaction
      await this.prisma.transaction.create({
        data: {
          accountId: account.id,
          providerTransactionId: `bitso_trade_${trade.tid}`,
          amount: amount,
          date: new Date(trade.created_at),
          description: `${trade.side.toUpperCase()} ${trade.symbol.toUpperCase()}`,
          merchant: 'Bitso Exchange',
          metadata: {
            tradeId: trade.tid,
            orderId: trade.oid,
            symbol: trade.symbol,
            side: trade.side,
            price: parseFloat(trade.price),
            fees: {
              amount: parseFloat(trade.fees_amount),
              currency: trade.fees_currency,
            },
            exchangeRate: parseFloat(trade.price),
          } as Prisma.JsonObject,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        // Transaction already exists, skip
        return;
      }
      this.logger.error(`Failed to create transaction for trade ${trade.tid}:`, error);
    }
  }

  async syncPortfolio(userId: string): Promise<void> {
    try {
      const connections = await this.prisma.providerConnection.findMany({
        where: {
          userId,
          provider: 'bitso',
        },
      });

      for (const connection of connections) {
        const apiKey = await this.cryptoService.decrypt(connection.encryptedToken);
        const apiSecret = await this.cryptoService.decrypt(
          (connection.metadata as any).encryptedApiSecret
        );
        
        const client = this.createTempClient(apiKey, apiSecret);
        
        // Get user's spaces to update accounts
        const userSpaces = await this.prisma.userSpace.findMany({
          where: { userId },
          include: { space: true },
        });

        for (const userSpace of userSpaces) {
          await this.syncBalances(userSpace.spaceId, client, connection.providerUserId);
        }
        
        // Sync recent trades
        await this.syncTrades(client, connection.providerUserId);
      }

      this.logger.log(`Synced Bitso portfolio for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to sync Bitso portfolio for user ${userId}:`, error);
    }
  }

  async handleWebhook(webhookData: BitsoWebhookDto, signature: string): Promise<void> {
    // Verify webhook signature
    if (!this.verifyWebhookSignature(JSON.stringify(webhookData), signature)) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const { type, tid, user, status } = webhookData;

    this.logger.log(`Received Bitso webhook: ${type} for transaction ${tid}`);

    try {
      switch (type) {
        case 'deposits':
        case 'withdrawals':
          await this.handleBalanceWebhook(webhookData);
          break;
        case 'trades':
          await this.handleTradeWebhook(webhookData);
          break;
        case 'orders':
          // Handle order status updates
          this.logger.log(`Order webhook received for ${tid}`);
          break;
        default:
          this.logger.log(`Unhandled webhook type: ${type}`);
      }
    } catch (error) {
      this.logger.error(`Failed to handle webhook for transaction ${tid}:`, error);
      throw error;
    }
  }

  private async handleBalanceWebhook(webhook: BitsoWebhookDto) {
    // Find user's connection and refresh balances
    const connection = await this.prisma.providerConnection.findFirst({
      where: {
        provider: 'bitso',
        providerUserId: webhook.user,
      },
    });

    if (connection) {
      await this.syncPortfolio(connection.userId);
    }
  }

  private async handleTradeWebhook(webhook: BitsoWebhookDto) {
    // Refresh portfolio after trade
    const connection = await this.prisma.providerConnection.findFirst({
      where: {
        provider: 'bitso',
        providerUserId: webhook.user,
      },
    });

    if (connection) {
      await this.syncPortfolio(connection.userId);
    }
  }

  private verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.webhookSecret || !signature) {
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload, 'utf8')
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex'),
    );
  }

  async getPortfolioSummary(userId: string): Promise<{
    totalValue: number;
    holdings: Array<{
      currency: string;
      amount: number;
      value: number;
      percentage: number;
    }>;
  }> {
    const accounts = await this.prisma.account.findMany({
      where: {
        provider: 'bitso',
        space: {
          userSpaces: {
            some: { userId }
          }
        }
      },
    });

    const totalValue = accounts.reduce((sum, account) => sum + account.balance, 0);
    
    const holdings = accounts.map((account) => {
      const metadata = account.metadata as any;
      return {
        currency: metadata.cryptoCurrency,
        amount: metadata.cryptoAmount,
        value: account.balance,
        percentage: totalValue > 0 ? (account.balance / totalValue) * 100 : 0,
      };
    });

    return { totalValue, holdings };
  }
}