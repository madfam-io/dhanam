import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { RedisService } from '../../../core/redis/redis.service';

import type {
  DeFiPortfolio,
  DeFiPosition,
  DeFiToken,
  DeFiNetwork,
  DeFiProtocol,
  DeFiPositionType,
  ZapperAppBalance,
  ZapperConfig,
} from './defi-position.interface';

@Injectable()
export class ZapperService implements OnModuleInit {
  private readonly logger = new Logger(ZapperService.name);
  private config: ZapperConfig;
  private requestCount = 0;
  private lastResetTime = Date.now();

  constructor(
    private readonly configService: ConfigService,
    private readonly redis: RedisService
  ) {
    this.config = {
      apiKey: this.configService.get<string>('ZAPPER_API_KEY', ''),
      baseUrl: this.configService.get<string>('ZAPPER_API_URL', 'https://api.zapper.xyz/v2'),
      rateLimitPerMinute: this.configService.get<number>('ZAPPER_RATE_LIMIT', 30),
    };
  }

  onModuleInit() {
    if (!this.config.apiKey) {
      this.logger.warn('Zapper API key not configured. DeFi positions will use mock data.');
    } else {
      this.logger.log('Zapper API integration initialized');
    }
  }

  /**
   * Check if Zapper API is available
   */
  isAvailable(): boolean {
    return Boolean(this.config.apiKey);
  }

  /**
   * Get all DeFi positions for a wallet address
   */
  async getPortfolio(address: string, network: DeFiNetwork = 'ethereum'): Promise<DeFiPortfolio> {
    const cacheKey = `zapper:portfolio:${address}:${network}`;

    // Check cache first (5 minute TTL for DeFi data)
    const cached = await this.getCachedValue<DeFiPortfolio>(cacheKey);
    if (cached) {
      this.logger.debug(`Portfolio cache hit: ${address}`);
      return cached;
    }

    // If no API key, return mock data
    if (!this.isAvailable()) {
      return this.getMockPortfolio(address, network);
    }

    // Rate limit check
    if (!this.checkRateLimit()) {
      this.logger.warn('Zapper API rate limit exceeded');
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    try {
      const positions = await this.fetchPositionsFromZapper(address, network);
      const portfolio = this.buildPortfolio(address, network, positions);

      // Cache for 5 minutes
      await this.setCachedValue(cacheKey, portfolio, 300);

      return portfolio;
    } catch (error) {
      this.logger.error(`Zapper API error: ${error}`);
      throw error;
    }
  }

  /**
   * Get positions for specific protocols
   */
  async getProtocolPositions(
    address: string,
    protocols: DeFiProtocol[],
    network: DeFiNetwork = 'ethereum'
  ): Promise<DeFiPosition[]> {
    const portfolio = await this.getPortfolio(address, network);
    return portfolio.positions.filter((p) => protocols.includes(p.protocol));
  }

  /**
   * Get aggregated stats across all networks for a wallet
   */
  async getMultiNetworkStats(
    address: string,
    networks: DeFiNetwork[] = ['ethereum', 'polygon', 'arbitrum']
  ): Promise<{
    totalValueUsd: number;
    totalBorrowedUsd: number;
    netWorthUsd: number;
    positionCount: number;
    networks: Record<DeFiNetwork, { valueUsd: number; positionCount: number }>;
  }> {
    const results = await Promise.all(
      networks.map(async (network) => {
        try {
          return { network, portfolio: await this.getPortfolio(address, network) };
        } catch {
          return { network, portfolio: null };
        }
      })
    );

    let totalValueUsd = 0;
    let totalBorrowedUsd = 0;
    let positionCount = 0;
    const networkStats: Record<DeFiNetwork, { valueUsd: number; positionCount: number }> =
      {} as Record<DeFiNetwork, { valueUsd: number; positionCount: number }>;

    for (const { network, portfolio } of results) {
      if (portfolio) {
        totalValueUsd += portfolio.totalBalanceUsd;
        totalBorrowedUsd += portfolio.totalBorrowedUsd;
        positionCount += portfolio.positions.length;
        networkStats[network] = {
          valueUsd: portfolio.totalBalanceUsd,
          positionCount: portfolio.positions.length,
        };
      }
    }

    return {
      totalValueUsd,
      totalBorrowedUsd,
      netWorthUsd: totalValueUsd - totalBorrowedUsd,
      positionCount,
      networks: networkStats,
    };
  }

  // ============ Private Helper Methods ============

  private async fetchPositionsFromZapper(
    address: string,
    network: DeFiNetwork
  ): Promise<ZapperAppBalance[]> {
    const url = new URL(`${this.config.baseUrl}/balances/apps`);
    url.searchParams.set('addresses[]', address);
    url.searchParams.set('network', network);

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Basic ${Buffer.from(this.config.apiKey + ':').toString('base64')}`,
      },
    });

    this.requestCount++;

    if (!response.ok) {
      throw new Error(`Zapper API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data[address.toLowerCase()] || [];
  }

  private buildPortfolio(
    address: string,
    network: DeFiNetwork,
    appBalances: ZapperAppBalance[]
  ): DeFiPortfolio {
    const positions: DeFiPosition[] = [];
    let totalBalanceUsd = 0;
    let totalBorrowedUsd = 0;

    for (const app of appBalances) {
      for (const product of app.products) {
        const position = this.mapZapperProductToPosition(app, product, network);
        positions.push(position);
        totalBalanceUsd += position.balanceUsd;
        if (position.borrowedUsd) {
          totalBorrowedUsd += position.borrowedUsd;
        }
      }
    }

    return {
      address,
      network,
      totalBalanceUsd,
      totalBorrowedUsd,
      netWorthUsd: totalBalanceUsd - totalBorrowedUsd,
      positions,
      lastUpdated: new Date(),
    };
  }

  private mapZapperProductToPosition(
    app: ZapperAppBalance,
    product: { label: string; assets: unknown[]; meta: unknown[] },
    network: DeFiNetwork
  ): DeFiPosition {
    const protocol = this.mapAppIdToProtocol(app.appId);
    const type = this.inferPositionType(product.label, app.appId);
    const assets = product.assets as Array<{
      symbol: string;
      address: string;
      decimals: number;
      supply: number;
      price: number;
      balanceUSD: number;
      dataProps?: { apy?: number };
    }>;

    const tokens: DeFiToken[] = assets.map((asset) => ({
      address: asset.address,
      symbol: asset.symbol,
      name: asset.symbol,
      decimals: asset.decimals,
      balance: asset.supply,
      price: asset.price,
      balanceUsd: asset.balanceUSD,
    }));

    const totalBalanceUsd = tokens.reduce((sum, t) => sum + t.balanceUsd, 0);

    // Extract APY if available
    let apy: number | undefined;
    if (assets.length > 0 && assets[0].dataProps?.apy) {
      apy = assets[0].dataProps.apy;
    }

    // Extract meta values
    const meta = product.meta as Array<{ label: string; value: number; type: string }>;
    let healthFactor: number | undefined;
    let borrowedUsd: number | undefined;
    let suppliedUsd: number | undefined;

    for (const m of meta) {
      if (m.label.toLowerCase().includes('health')) {
        healthFactor = m.value;
      }
      if (m.label.toLowerCase().includes('borrow')) {
        borrowedUsd = m.value;
      }
      if (m.label.toLowerCase().includes('suppl')) {
        suppliedUsd = m.value;
      }
    }

    return {
      id: `${app.appId}-${product.label}-${network}`,
      protocol,
      network,
      type,
      label: `${app.appName} - ${product.label}`,
      tokens,
      balanceUsd: totalBalanceUsd,
      apy,
      healthFactor,
      borrowedUsd,
      suppliedUsd,
    };
  }

  private mapAppIdToProtocol(appId: string): DeFiProtocol {
    const mapping: Record<string, DeFiProtocol> = {
      uniswap: 'uniswap-v2',
      'uniswap-v2': 'uniswap-v2',
      'uniswap-v3': 'uniswap-v3',
      aave: 'aave-v2',
      'aave-v2': 'aave-v2',
      'aave-v3': 'aave-v3',
      compound: 'compound-v2',
      'compound-v2': 'compound-v2',
      'compound-v3': 'compound-v3',
      curve: 'curve',
      lido: 'lido',
      yearn: 'yearn',
      maker: 'maker',
      convex: 'convex',
      balancer: 'balancer',
      sushiswap: 'sushiswap',
      pancakeswap: 'pancakeswap',
    };

    return mapping[appId.toLowerCase()] || 'other';
  }

  private inferPositionType(label: string, appId: string): DeFiPositionType {
    const lowerLabel = label.toLowerCase();
    const lowerAppId = appId.toLowerCase();

    if (lowerLabel.includes('borrow')) return 'borrowing';
    if (lowerLabel.includes('lend') || lowerLabel.includes('supply')) return 'lending';
    if (lowerLabel.includes('stake') || lowerAppId.includes('lido')) return 'staking';
    if (lowerLabel.includes('farm') || lowerLabel.includes('yield')) return 'farming';
    if (lowerLabel.includes('vault') || lowerAppId.includes('yearn')) return 'vault';
    if (lowerLabel.includes('pool') || lowerLabel.includes('lp')) return 'liquidity-pool';

    return 'liquidity-pool';
  }

  private async getCachedValue<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.redis.get(key);
      if (cached) {
        return JSON.parse(cached) as T;
      }
    } catch (error) {
      this.logger.warn(`Cache read error: ${error}`);
    }
    return null;
  }

  private async setCachedValue(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(value), ttlSeconds);
    } catch (error) {
      this.logger.warn(`Cache write error: ${error}`);
    }
  }

  private checkRateLimit(): boolean {
    const now = Date.now();
    const oneMinute = 60 * 1000;

    if (now - this.lastResetTime > oneMinute) {
      this.requestCount = 0;
      this.lastResetTime = now;
    }

    return this.requestCount < this.config.rateLimitPerMinute;
  }

  // ============ Mock Data Methods ============

  private getMockPortfolio(address: string, network: DeFiNetwork): DeFiPortfolio {
    // Generate deterministic mock data based on address
    const hash = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hasPositions = hash % 3 !== 0; // 2/3 chance of having positions

    if (!hasPositions) {
      return {
        address,
        network,
        totalBalanceUsd: 0,
        totalBorrowedUsd: 0,
        netWorthUsd: 0,
        positions: [],
        lastUpdated: new Date(),
      };
    }

    const positions: DeFiPosition[] = [];

    // Mock Uniswap LP position
    if (hash % 2 === 0) {
      positions.push({
        id: `mock-uniswap-${address.slice(0, 8)}`,
        protocol: 'uniswap-v3',
        network,
        type: 'liquidity-pool',
        label: 'Uniswap V3 - ETH/USDC',
        tokens: [
          {
            address: '0x...',
            symbol: 'ETH',
            name: 'Ethereum',
            decimals: 18,
            balance: 0.5 + (hash % 10) / 10,
            price: 3200,
            balanceUsd: (0.5 + (hash % 10) / 10) * 3200,
          },
          {
            address: '0x...',
            symbol: 'USDC',
            name: 'USD Coin',
            decimals: 6,
            balance: 1500 + (hash % 500),
            price: 1,
            balanceUsd: 1500 + (hash % 500),
          },
        ],
        balanceUsd: (0.5 + (hash % 10) / 10) * 3200 + 1500 + (hash % 500),
        apy: 5 + (hash % 15),
      });
    }

    // Mock Aave lending position
    if (hash % 3 === 1) {
      const suppliedAmount = 5000 + (hash % 10000);
      positions.push({
        id: `mock-aave-${address.slice(0, 8)}`,
        protocol: 'aave-v3',
        network,
        type: 'lending',
        label: 'Aave V3 - Lending',
        tokens: [
          {
            address: '0x...',
            symbol: 'USDC',
            name: 'USD Coin',
            decimals: 6,
            balance: suppliedAmount,
            price: 1,
            balanceUsd: suppliedAmount,
          },
        ],
        balanceUsd: suppliedAmount,
        apy: 3 + (hash % 5),
        suppliedUsd: suppliedAmount,
        healthFactor: 1.5 + (hash % 30) / 10,
      });
    }

    // Mock Lido staking position
    if (hash % 4 === 2) {
      const stakedEth = 1 + (hash % 5);
      positions.push({
        id: `mock-lido-${address.slice(0, 8)}`,
        protocol: 'lido',
        network,
        type: 'staking',
        label: 'Lido - Staked ETH',
        tokens: [
          {
            address: '0x...',
            symbol: 'stETH',
            name: 'Staked ETH',
            decimals: 18,
            balance: stakedEth,
            price: 3200,
            balanceUsd: stakedEth * 3200,
          },
        ],
        balanceUsd: stakedEth * 3200,
        apy: 4.2,
      });
    }

    const totalBalanceUsd = positions.reduce((sum, p) => sum + p.balanceUsd, 0);

    return {
      address,
      network,
      totalBalanceUsd,
      totalBorrowedUsd: 0,
      netWorthUsd: totalBalanceUsd,
      positions,
      lastUpdated: new Date(),
    };
  }
}
