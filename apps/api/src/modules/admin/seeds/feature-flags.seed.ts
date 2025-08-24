import { RedisService } from '@core/redis/redis.service';
import { FeatureFlagDto } from '../dto';

export const DEFAULT_FEATURE_FLAGS: Omit<FeatureFlagDto, 'key'>[] = [
  {
    name: 'ESG Scoring',
    description: 'Enable ESG scoring for crypto assets',
    enabled: true,
    percentageRollout: 100,
    allowedUserIds: [],
    metadata: {
      category: 'crypto',
      releaseDate: '2024-01-01',
    },
  },
  {
    name: 'Advanced Analytics',
    description: 'Enable advanced analytics dashboard features',
    enabled: false,
    percentageRollout: 0,
    allowedUserIds: [],
    metadata: {
      category: 'analytics',
      status: 'beta',
    },
  },
  {
    name: 'Cashflow Forecasting',
    description: 'Enable 60-day cashflow forecasting',
    enabled: true,
    percentageRollout: 100,
    allowedUserIds: [],
    metadata: {
      category: 'budgeting',
      forecastDays: 60,
    },
  },
  {
    name: 'Multi-Currency Support',
    description: 'Enable multi-currency account management',
    enabled: true,
    percentageRollout: 100,
    allowedUserIds: [],
    metadata: {
      category: 'accounts',
      supportedCurrencies: ['MXN', 'USD', 'EUR'],
    },
  },
  {
    name: 'AI Transaction Categorization',
    description: 'Use AI for enhanced transaction categorization',
    enabled: false,
    percentageRollout: 10,
    allowedUserIds: [],
    metadata: {
      category: 'ai',
      model: 'gpt-4',
      status: 'experimental',
    },
  },
  {
    name: 'Export to Excel',
    description: 'Enable Excel export functionality',
    enabled: true,
    percentageRollout: 100,
    allowedUserIds: [],
    metadata: {
      category: 'export',
      formats: ['xlsx', 'csv'],
    },
  },
  {
    name: 'Mobile Push Notifications',
    description: 'Enable push notifications for mobile app',
    enabled: false,
    percentageRollout: 0,
    allowedUserIds: [],
    metadata: {
      category: 'mobile',
      status: 'development',
    },
  },
  {
    name: 'Business Expenses Module',
    description: 'Enable business expense tracking features',
    enabled: true,
    percentageRollout: 100,
    allowedUserIds: [],
    metadata: {
      category: 'business',
      features: ['receipt_scanning', 'mileage_tracking', 'expense_reports'],
    },
  },
];

export async function seedFeatureFlags(redis: RedisService) {
  const FEATURE_FLAGS_KEY = 'admin:feature_flags';
  
  for (const flag of DEFAULT_FEATURE_FLAGS) {
    const key = flag.name.toLowerCase().replace(/\s+/g, '_');
    const existingFlag = await redis.hget(FEATURE_FLAGS_KEY, key);
    
    if (!existingFlag) {
      await redis.hset(FEATURE_FLAGS_KEY, key, JSON.stringify(flag));
      console.log(`Created feature flag: ${key}`);
    }
  }
  
  console.log('Feature flags seeding completed');
}