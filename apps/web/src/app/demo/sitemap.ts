import type { MetadataRoute } from 'next';

const BASE_URL = 'https://app.dhan.am';

const demoPaths = [
  '/demo',
  '/demo/dashboard',
  '/demo/accounts',
  '/demo/transactions',
  '/demo/budgets',
  '/demo/budgets/zero-based',
  '/demo/goals',
  '/demo/households',
  '/demo/estate-planning',
  '/demo/estate-planning/life-beat',
  '/demo/analytics',
  '/demo/esg',
  '/demo/gaming',
  '/demo/retirement',
  '/demo/scenarios',
  '/demo/reports',
  '/demo/settings',
  '/demo/assets',
  '/demo/projections',
  '/demo/notifications',
];

export default function sitemap(): MetadataRoute.Sitemap {
  return demoPaths.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: path === '/demo' ? 0.8 : 0.6,
  }));
}
