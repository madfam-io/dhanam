import { Injectable, Logger } from '@nestjs/common';

import type {
  CatalogItem,
  CollectibleProviderAdapter,
  ValuationResult,
} from '../interfaces/collectible-provider.interface';

interface ArtsyArtwork {
  id: string;
  title: string;
  date?: string;
  medium?: string;
  dimensions?: { in?: string; cm?: string };
  image_url?: string;
  collecting_institution?: string;
  _links?: {
    artists?: { href: string };
    partner?: { href: string };
    image?: { href: string };
  };
}

interface ArtsyArtworkDetail extends ArtsyArtwork {
  sale_message?: string;
  price_currency?: string;
  sold?: boolean;
  availability?: string;
  /** Artsy may expose estimated low/high in embedded sale info */
  price_listed?: number;
  estimate_low_cents?: number;
  estimate_high_cents?: number;
}

interface ArtsySearchResult {
  _embedded?: {
    results?: Array<{
      type: string;
      title: string;
      description?: string;
      og_image?: string;
      _links?: { self?: { href: string }; permalink?: { href: string } };
    }>;
  };
}

interface ArtsyArtworksResponse {
  _embedded?: { artworks?: ArtsyArtwork[] };
}

interface ArtsyTokenResponse {
  type: string;
  token: string;
  expires_at: string;
}

@Injectable()
export class ArtsyAdapter implements CollectibleProviderAdapter {
  readonly provider = 'artsy';
  readonly category = 'art' as const;
  readonly supportedCurrencies = ['USD'];

  private readonly logger = new Logger(ArtsyAdapter.name);
  private readonly baseUrl = 'https://api.artsy.net/api';
  private readonly clientId: string | undefined;
  private readonly clientSecret: string | undefined;

  private cachedToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  constructor() {
    this.clientId = process.env.ARTSY_CLIENT_ID;
    this.clientSecret = process.env.ARTSY_CLIENT_SECRET;
    if (!this.clientId || !this.clientSecret) {
      this.logger.warn('ARTSY_CLIENT_ID / ARTSY_CLIENT_SECRET not configured — adapter disabled');
    }
  }

  isAvailable(): boolean {
    return !!this.clientId && !!this.clientSecret;
  }

  async search(query: string, limit = 10): Promise<CatalogItem[]> {
    if (!this.isAvailable()) return [];

    try {
      const token = await this.getToken();
      if (!token) return [];

      const params = new URLSearchParams({
        q: query,
        size: String(limit),
        type: 'artwork',
      });

      const res = await fetch(`${this.baseUrl}/search?${params}`, {
        headers: this.headers(token),
      });

      if (!res.ok) {
        this.logger.warn(`Artsy search failed: ${res.status} ${res.statusText}`);
        return [];
      }

      const data = (await res.json()) as ArtsySearchResult;
      const results = data._embedded?.results ?? [];

      // Filter to artwork results only and extract IDs from hrefs
      const artworkResults = results.filter((r) => r.type === 'artwork');

      // Fetch artwork details for each result to get structured data
      const artworkIds = artworkResults
        .map((r) => {
          const href = r._links?.self?.href;
          if (!href) return null;
          // Extract ID from href like https://api.artsy.net/api/artworks/{id}
          const match = href.match(/artworks\/([^/?]+)/);
          return match ? match[1] : null;
        })
        .filter((id): id is string => id !== null)
        .slice(0, limit);

      if (artworkIds.length === 0) {
        // Fall back to using search results directly
        return artworkResults.slice(0, limit).map((r, idx) => ({
          externalId: `artsy-search-${idx}`,
          provider: this.provider,
          category: this.category,
          name: r.title,
          imageUrl: r.og_image,
          currency: 'USD',
        }));
      }

      // Fetch full artwork details in batch via artworks endpoint
      const artworksParams = new URLSearchParams();
      artworkIds.forEach((id) => artworksParams.append('artwork_id[]', id));

      const artworksRes = await fetch(`${this.baseUrl}/artworks?${artworksParams}`, {
        headers: this.headers(token),
      });

      if (!artworksRes.ok) {
        // Fall back to search results
        return artworkResults.slice(0, limit).map((r, idx) => ({
          externalId: `artsy-search-${idx}`,
          provider: this.provider,
          category: this.category,
          name: r.title,
          imageUrl: r.og_image,
          currency: 'USD',
        }));
      }

      const artworksData = (await artworksRes.json()) as ArtsyArtworksResponse;
      const artworks = artworksData._embedded?.artworks ?? [];

      return artworks.map((aw) => ({
        externalId: aw.id,
        provider: this.provider,
        category: this.category,
        name: aw.title,
        imageUrl: aw.image_url ?? this.buildImageUrl(aw),
        currency: 'USD',
        metadata: {
          date: aw.date,
          medium: aw.medium,
          dimensions: aw.dimensions,
          collectingInstitution: aw.collecting_institution,
        },
      }));
    } catch (error) {
      this.logger.warn(`Artsy search error: ${error instanceof Error ? error.message : error}`);
      return [];
    }
  }

  async getValuation(externalId: string): Promise<ValuationResult | null> {
    if (!this.isAvailable()) return null;

    try {
      const token = await this.getToken();
      if (!token) return null;

      const res = await fetch(`${this.baseUrl}/artworks/${encodeURIComponent(externalId)}`, {
        headers: this.headers(token),
      });

      if (!res.ok) {
        this.logger.warn(`Artsy valuation failed for ${externalId}: ${res.status}`);
        return null;
      }

      const artwork = (await res.json()) as ArtsyArtworkDetail;

      // Artsy does not provide a direct "market value" for most artworks.
      // We derive valuation from sale_message, estimate ranges, and listed prices.
      const marketValue = this.extractMarketValue(artwork);
      if (marketValue == null) return null;

      return {
        externalId,
        provider: this.provider,
        marketValue,
        currency: artwork.price_currency ?? 'USD',
        valueLow: artwork.estimate_low_cents != null ? artwork.estimate_low_cents / 100 : undefined,
        valueHigh:
          artwork.estimate_high_cents != null ? artwork.estimate_high_cents / 100 : undefined,
        source: 'artsy',
        fetchedAt: new Date(),
      };
    } catch (error) {
      this.logger.warn(
        `Artsy valuation error for ${externalId}: ${error instanceof Error ? error.message : error}`
      );
      return null;
    }
  }

  async healthCheck(): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const results = await this.search('Picasso', 1);
      return results.length > 0;
    } catch {
      return false;
    }
  }

  // ── Private helpers ───────────────────────────────

  private async getToken(): Promise<string | null> {
    // Return cached token if still valid (with 60s buffer)
    if (
      this.cachedToken &&
      this.tokenExpiresAt &&
      this.tokenExpiresAt.getTime() > Date.now() + 60_000
    ) {
      return this.cachedToken;
    }

    try {
      const res = await fetch(`${this.baseUrl}/tokens/xapp_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
      });

      if (!res.ok) {
        this.logger.warn(`Artsy token exchange failed: ${res.status}`);
        this.cachedToken = null;
        this.tokenExpiresAt = null;
        return null;
      }

      const data = (await res.json()) as ArtsyTokenResponse;
      this.cachedToken = data.token;
      this.tokenExpiresAt = new Date(data.expires_at);

      return this.cachedToken;
    } catch (error) {
      this.logger.warn(`Artsy token error: ${error instanceof Error ? error.message : error}`);
      this.cachedToken = null;
      this.tokenExpiresAt = null;
      return null;
    }
  }

  private headers(token: string): Record<string, string> {
    return {
      'X-XAPP-Token': token,
      Accept: 'application/vnd.artsy-v2+json',
    };
  }

  /**
   * Extract a numeric market value from Artsy artwork detail.
   *
   * Artsy exposes pricing in several ways:
   * 1. `price_listed` — explicit numeric price
   * 2. `sale_message` — e.g. "$12,000" or "Contact for price"
   * 3. `estimate_low_cents` / `estimate_high_cents` — auction estimates
   *
   * We try each source in order and return the first parseable value.
   */
  private extractMarketValue(artwork: ArtsyArtworkDetail): number | null {
    // 1. Direct listed price
    if (artwork.price_listed != null && artwork.price_listed > 0) {
      return artwork.price_listed;
    }

    // 2. Parse sale_message (e.g. "$12,000" or "USD 12,000")
    if (artwork.sale_message) {
      const cleaned = artwork.sale_message.replace(/[^0-9.]/g, '');
      const parsed = parseFloat(cleaned);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }

    // 3. Midpoint of auction estimate range
    if (artwork.estimate_low_cents != null && artwork.estimate_high_cents != null) {
      return (artwork.estimate_low_cents + artwork.estimate_high_cents) / 2 / 100;
    }

    return null;
  }

  private buildImageUrl(artwork: ArtsyArtwork): string | undefined {
    const imageLink = artwork._links?.image?.href;
    if (!imageLink) return undefined;
    // Artsy image links use template format: {image_version}
    return imageLink.replace('{image_version}', 'large');
  }
}
