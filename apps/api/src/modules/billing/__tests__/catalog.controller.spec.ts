import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { CatalogController } from '../catalog.controller';
import { ProductCatalogService } from '../services/product-catalog.service';

describe('CatalogController', () => {
  let controller: CatalogController;
  let catalogService: {
    getFullCatalog: jest.Mock;
    getProductBySlug: jest.Mock;
    getCreditCosts: jest.Mock;
  };

  const mockCatalogProduct = {
    slug: 'dhanam',
    name: 'Dhanam',
    description: 'AI-powered wealth tracking',
    category: 'finance',
    iconUrl: null,
    websiteUrl: 'https://app.dhan.am',
    tiers: [
      {
        tierSlug: 'essentials',
        dhanamTier: 'essentials',
        displayName: 'Essentials',
        description: null,
        metadata: null,
        prices: { USD: { monthly: 499, yearly: 4790 } },
        features: ['AI categorization', 'Bank sync'],
      },
    ],
    creditCosts: [{ operation: 'api_request', credits: 1, label: 'API Request' }],
  };

  beforeEach(async () => {
    catalogService = {
      getFullCatalog: jest.fn(),
      getProductBySlug: jest.fn(),
      getCreditCosts: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CatalogController],
      providers: [{ provide: ProductCatalogService, useValue: catalogService }],
    }).compile();

    controller = module.get(CatalogController);
  });

  describe('GET /billing/catalog', () => {
    it('should return full catalog with products and updatedAt', async () => {
      catalogService.getFullCatalog.mockResolvedValue([mockCatalogProduct]);

      const result = await controller.getFullCatalog();

      expect(result.products).toHaveLength(1);
      expect(result.products[0].slug).toBe('dhanam');
      expect(result.updatedAt).toBeDefined();
    });

    it('should return empty array when no products', async () => {
      catalogService.getFullCatalog.mockResolvedValue([]);

      const result = await controller.getFullCatalog();

      expect(result.products).toEqual([]);
    });
  });

  describe('GET /billing/catalog/:slug', () => {
    it('should return single product by slug', async () => {
      catalogService.getProductBySlug.mockResolvedValue(mockCatalogProduct);

      const result = await controller.getProduct('dhanam');

      expect(result.slug).toBe('dhanam');
      expect(result.tiers).toHaveLength(1);
    });

    it('should propagate NotFoundException for unknown slug', async () => {
      catalogService.getProductBySlug.mockRejectedValue(
        new NotFoundException('Product not found: unknown')
      );

      await expect(controller.getProduct('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('GET /billing/catalog/:slug/credit-costs', () => {
    it('should return credit costs for a product', async () => {
      catalogService.getCreditCosts.mockResolvedValue([
        { operation: 'api_request', credits: 1, label: 'API Request' },
      ]);

      const result = await controller.getCreditCosts('dhanam');

      expect(result).toHaveLength(1);
      expect(result[0].credits).toBe(1);
    });

    it('should return 404 when product does not exist and no costs found', async () => {
      catalogService.getCreditCosts.mockResolvedValue([]);
      catalogService.getProductBySlug.mockRejectedValue(
        new NotFoundException('Product not found: nonexistent')
      );

      await expect(controller.getCreditCosts('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
