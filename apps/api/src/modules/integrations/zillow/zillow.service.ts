import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

import { RedisService } from '../../../core/redis/redis.service';

import type {
  ZillowPropertyDetails,
  ZillowSearchResult,
  PropertyValuationResult,
  AddressLookupResult,
  ZillowConfig,
} from './zillow.types';

@Injectable()
export class ZillowService implements OnModuleInit {
  private readonly logger = new Logger(ZillowService.name);
  private config: ZillowConfig;
  private requestCount = 0;
  private lastResetTime = Date.now();

  constructor(
    private readonly configService: ConfigService,
    private readonly redis: RedisService
  ) {
    this.config = {
      apiKey: this.configService.get<string>('ZILLOW_API_KEY', ''),
      baseUrl: this.configService.get<string>(
        'ZILLOW_API_URL',
        'https://api.bridgedataoutput.com/api/v2/zestimates'
      ),
      rateLimitPerMinute: this.configService.get<number>('ZILLOW_RATE_LIMIT', 100),
      cacheEnabled: this.configService.get<boolean>('ZILLOW_CACHE_ENABLED', true),
      cacheTtlHours: this.configService.get<number>('ZILLOW_CACHE_TTL_HOURS', 24),
    };
  }

  onModuleInit() {
    if (!this.config.apiKey) {
      this.logger.warn('Zillow API key not configured. Property valuations will use mock data.');
    } else {
      this.logger.log('Zillow API integration initialized');
    }
  }

  /**
   * Check if Zillow API is available
   */
  isAvailable(): boolean {
    return Boolean(this.config.apiKey);
  }

  /**
   * Look up a property by address
   */
  async lookupAddress(
    streetAddress: string,
    city: string,
    state: string,
    zipcode?: string
  ): Promise<AddressLookupResult> {
    const cacheKey = this.getAddressCacheKey(streetAddress, city, state, zipcode);

    // Check cache first
    if (this.config.cacheEnabled) {
      const cached = await this.getCachedValue<AddressLookupResult>(cacheKey);
      if (cached) {
        this.logger.debug(`Address lookup cache hit: ${streetAddress}`);
        return cached;
      }
    }

    // If no API key, return mock data
    if (!this.isAvailable()) {
      return this.getMockAddressLookup(streetAddress, city, state, zipcode);
    }

    // Rate limit check
    if (!this.checkRateLimit()) {
      this.logger.warn('Zillow API rate limit exceeded');
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    try {
      const result = await this.callZillowAddressApi(streetAddress, city, state, zipcode);

      // Cache the result
      if (this.config.cacheEnabled && result.found) {
        await this.setCachedValue(cacheKey, result, this.config.cacheTtlHours * 3600);
      }

      return result;
    } catch (error) {
      this.logger.error(`Zillow address lookup failed: ${error}`);
      throw error;
    }
  }

  /**
   * Get property valuation by ZPID (Zillow Property ID)
   */
  async getPropertyValuation(zpid: string): Promise<PropertyValuationResult | null> {
    const cacheKey = `zillow:valuation:${zpid}`;

    // Check cache first
    if (this.config.cacheEnabled) {
      const cached = await this.getCachedValue<PropertyValuationResult>(cacheKey);
      if (cached) {
        this.logger.debug(`Property valuation cache hit: ${zpid}`);
        return cached;
      }
    }

    // If no API key, return mock data
    if (!this.isAvailable()) {
      return this.getMockPropertyValuation(zpid);
    }

    // Rate limit check
    if (!this.checkRateLimit()) {
      this.logger.warn('Zillow API rate limit exceeded');
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    try {
      const details = await this.callZillowPropertyApi(zpid);

      if (!details || !details.zestimate) {
        return null;
      }

      const result: PropertyValuationResult = {
        zpid: details.zpid,
        address: this.formatAddress(details.address),
        zestimate: details.zestimate.amount,
        zestimateLow: details.zestimate.lowEstimate || details.zestimate.amount * 0.9,
        zestimateHigh: details.zestimate.highEstimate || details.zestimate.amount * 1.1,
        rentEstimate: details.rentZestimate?.amount,
        lastUpdated: new Date(details.zestimate.lastUpdated),
        valueChange30Day: details.zestimate.valueChange30Day,
        propertyDetails: {
          propertyType: details.propertyType,
          yearBuilt: details.yearBuilt,
          lotSize: details.lotSize,
          livingArea: details.livingArea,
          bedrooms: details.bedrooms,
          bathrooms: details.bathrooms,
          lastSoldDate: details.lastSoldDate,
          lastSoldPrice: details.lastSoldPrice,
        },
      };

      // Cache the result
      if (this.config.cacheEnabled) {
        await this.setCachedValue(cacheKey, result, this.config.cacheTtlHours * 3600);
      }

      return result;
    } catch (error) {
      this.logger.error(`Zillow property valuation failed: ${error}`);
      throw error;
    }
  }

  /**
   * Search properties by address (returns multiple matches)
   */
  async searchProperties(query: string, limit = 5): Promise<ZillowSearchResult[]> {
    if (!this.isAvailable()) {
      return this.getMockSearchResults(query, limit);
    }

    if (!this.checkRateLimit()) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    // This would call the Zillow search API
    // For now, return empty array until API is configured
    return [];
  }

  /**
   * Refresh valuations for all tracked properties
   * Runs daily at 6 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async refreshAllPropertyValuations(): Promise<void> {
    if (!this.isAvailable()) {
      this.logger.debug('Skipping property refresh - Zillow API not configured');
      return;
    }

    this.logger.log('Starting scheduled property valuation refresh');
    // This will be called by the PropertyValuationProcessor
    // The actual batch processing is handled there
  }

  // ============ Private Helper Methods ============

  private async callZillowAddressApi(
    streetAddress: string,
    city: string,
    state: string,
    zipcode?: string
  ): Promise<AddressLookupResult> {
    const address = zipcode
      ? `${streetAddress}, ${city}, ${state} ${zipcode}`
      : `${streetAddress}, ${city}, ${state}`;

    const url = new URL(this.config.baseUrl);
    url.searchParams.set('access_token', this.config.apiKey);
    url.searchParams.set('address', address);

    const response = await fetch(url.toString());
    this.requestCount++;

    if (!response.ok) {
      throw new Error(`Zillow API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.bundle && data.bundle.length > 0) {
      const property = data.bundle[0];
      return {
        found: true,
        zpid: property.zpid || property.id,
        formattedAddress: property.address
          ? `${property.address.streetAddress}, ${property.address.city}, ${property.address.state} ${property.address.zipcode}`
          : address,
      };
    }

    return { found: false };
  }

  private async callZillowPropertyApi(zpid: string): Promise<ZillowPropertyDetails | null> {
    const url = new URL(`${this.config.baseUrl}/${zpid}`);
    url.searchParams.set('access_token', this.config.apiKey);

    const response = await fetch(url.toString());
    this.requestCount++;

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Zillow API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.bundle || data.bundle.length === 0) {
      return null;
    }

    const property = data.bundle[0];
    return {
      zpid: property.zpid || zpid,
      address: property.address || {},
      zestimate: property.zestimate
        ? {
            amount: property.zestimate,
            currency: 'USD',
            lastUpdated: new Date().toISOString(),
            lowEstimate: property.zestimateLow,
            highEstimate: property.zestimateHigh,
          }
        : undefined,
      rentZestimate: property.rentalZestimate
        ? {
            amount: property.rentalZestimate,
            currency: 'USD',
            lastUpdated: new Date().toISOString(),
          }
        : undefined,
      propertyType: property.propertyType,
      yearBuilt: property.yearBuilt,
      lotSize: property.lotSize,
      livingArea: property.livingArea,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      lastSoldDate: property.lastSoldDate,
      lastSoldPrice: property.lastSoldPrice,
    };
  }

  private formatAddress(address: {
    streetAddress?: string;
    city?: string;
    state?: string;
    zipcode?: string;
  }): string {
    const parts = [address.streetAddress, address.city, address.state, address.zipcode].filter(
      Boolean
    );
    return parts.join(', ');
  }

  private getAddressCacheKey(
    streetAddress: string,
    city: string,
    state: string,
    zipcode?: string
  ): string {
    const normalized = `${streetAddress}|${city}|${state}|${zipcode || ''}`
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
    return `zillow:address:${Buffer.from(normalized).toString('base64')}`;
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

    // Reset counter if a minute has passed
    if (now - this.lastResetTime > oneMinute) {
      this.requestCount = 0;
      this.lastResetTime = now;
    }

    return this.requestCount < this.config.rateLimitPerMinute;
  }

  // ============ Mock Data Methods (for development without API key) ============

  private getMockAddressLookup(
    streetAddress: string,
    city: string,
    state: string,
    zipcode?: string
  ): AddressLookupResult {
    // Generate a deterministic mock ZPID based on address
    const mockZpid = `mock-${Buffer.from(`${streetAddress}${city}${state}`).toString('hex').slice(0, 12)}`;

    return {
      found: true,
      zpid: mockZpid,
      formattedAddress: [streetAddress, city, state, zipcode].filter(Boolean).join(', '),
    };
  }

  private getMockPropertyValuation(zpid: string): PropertyValuationResult {
    // Generate deterministic mock values based on ZPID
    const hash = zpid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const baseValue = 300000 + (hash % 700000);

    return {
      zpid,
      address: 'Mock Property Address',
      zestimate: baseValue,
      zestimateLow: Math.round(baseValue * 0.92),
      zestimateHigh: Math.round(baseValue * 1.08),
      rentEstimate: Math.round(baseValue / 200),
      lastUpdated: new Date(),
      valueChange30Day: Math.round((hash % 20000) - 10000),
      propertyDetails: {
        propertyType: 'SingleFamily',
        yearBuilt: 1990 + (hash % 34),
        livingArea: 1500 + (hash % 2000),
        bedrooms: 3 + (hash % 3),
        bathrooms: 2 + (hash % 2),
      },
    };
  }

  private getMockSearchResults(query: string, limit: number): ZillowSearchResult[] {
    const results: ZillowSearchResult[] = [];
    for (let i = 0; i < Math.min(limit, 3); i++) {
      const mockZpid = `mock-search-${i}-${query.slice(0, 10)}`;
      results.push({
        zpid: mockZpid,
        address: {
          streetAddress: `${100 + i} ${query} St`,
          city: 'Sample City',
          state: 'CA',
          zipcode: '90210',
        },
        zestimate: 350000 + i * 50000,
        bedrooms: 3,
        bathrooms: 2,
        livingArea: 1800,
      });
    }
    return results;
  }
}
