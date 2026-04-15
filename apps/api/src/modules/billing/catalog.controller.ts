import { Controller, Get, Header, NotFoundException, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { ProductCatalogService } from './services/product-catalog.service';

/**
 * Product Catalog Controller
 *
 * Public, unauthenticated endpoints for querying the MADFAM product catalog.
 * Used by pricing pages across all ecosystem products and by the AutoSwarm
 * ProductCatalogTool for agent product awareness.
 *
 * All responses are cached for 5 minutes at the service level and include
 * Cache-Control headers for CDN caching.
 */
@ApiTags('catalog')
@Controller('billing/catalog')
export class CatalogController {
  constructor(private readonly catalog: ProductCatalogService) {}

  @Get()
  @Header('Cache-Control', 'public, max-age=300, s-maxage=300')
  @ApiOperation({ summary: 'Get full product catalog (public, no auth)' })
  async getFullCatalog() {
    const products = await this.catalog.getFullCatalog();
    return {
      products,
      updatedAt: new Date().toISOString(),
    };
  }

  @Get(':slug')
  @Header('Cache-Control', 'public, max-age=300, s-maxage=300')
  @ApiOperation({ summary: 'Get a single product by slug (public, no auth)' })
  @ApiParam({ name: 'slug', example: 'karafiel' })
  async getProduct(@Param('slug') slug: string) {
    return this.catalog.getProductBySlug(slug);
  }

  @Get(':slug/credit-costs')
  @Header('Cache-Control', 'public, max-age=300, s-maxage=300')
  @ApiOperation({ summary: 'Get credit costs for a product (public, no auth)' })
  @ApiParam({ name: 'slug', example: 'karafiel' })
  async getCreditCosts(@Param('slug') slug: string) {
    const costs = await this.catalog.getCreditCosts(slug);
    if (costs.length === 0) {
      // Check if the product exists at all
      try {
        await this.catalog.getProductBySlug(slug);
      } catch {
        throw new NotFoundException(`Product not found: ${slug}`);
      }
    }
    return costs;
  }
}
