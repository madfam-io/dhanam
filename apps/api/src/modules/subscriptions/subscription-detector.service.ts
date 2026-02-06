import { SUBSCRIPTION } from '@dhanam/shared';
import { Injectable, Logger } from '@nestjs/common';

import { Currency, RecurrenceFrequency, SubscriptionCategory, SubscriptionStatus } from '@db';

import { PrismaService } from '../../core/prisma/prisma.service';

// Known subscription services with their metadata
const KNOWN_SERVICES: Record<
  string,
  {
    category: SubscriptionCategory;
    icon?: string;
    url?: string;
    aliases: string[];
  }
> = {
  netflix: {
    category: 'streaming',
    icon: 'netflix',
    url: 'https://netflix.com',
    aliases: ['netflix.com', 'netflix inc'],
  },
  spotify: {
    category: 'music',
    icon: 'spotify',
    url: 'https://spotify.com',
    aliases: ['spotify.com', 'spotify ab', 'spotify usa'],
  },
  'disney+': {
    category: 'streaming',
    icon: 'disney-plus',
    url: 'https://disneyplus.com',
    aliases: ['disney plus', 'disneyplus', 'disney+'],
  },
  'amazon prime': {
    category: 'streaming',
    icon: 'amazon',
    url: 'https://amazon.com/prime',
    aliases: ['prime video', 'amzn prime', 'amazon.com'],
  },
  'hbo max': {
    category: 'streaming',
    icon: 'hbo',
    url: 'https://max.com',
    aliases: ['hbo', 'max.com', 'warnermedia'],
  },
  youtube: {
    category: 'streaming',
    icon: 'youtube',
    url: 'https://youtube.com/premium',
    aliases: ['youtube premium', 'youtube music', 'google youtube'],
  },
  apple: {
    category: 'streaming',
    icon: 'apple',
    url: 'https://apple.com',
    aliases: ['apple music', 'apple tv', 'apple one', 'apple.com/bill', 'itunes'],
  },
  github: {
    category: 'software',
    icon: 'github',
    url: 'https://github.com',
    aliases: ['github.com', 'github inc'],
  },
  dropbox: {
    category: 'cloud_storage',
    icon: 'dropbox',
    url: 'https://dropbox.com',
    aliases: ['dropbox.com', 'dropbox inc'],
  },
  google: {
    category: 'cloud_storage',
    icon: 'google',
    url: 'https://one.google.com',
    aliases: ['google one', 'google storage', 'google.com'],
  },
  microsoft: {
    category: 'software',
    icon: 'microsoft',
    url: 'https://microsoft.com',
    aliases: ['microsoft 365', 'office 365', 'xbox game pass', 'xbox live'],
  },
  adobe: {
    category: 'software',
    icon: 'adobe',
    url: 'https://adobe.com',
    aliases: ['adobe.com', 'adobe systems', 'creative cloud'],
  },
  notion: {
    category: 'productivity',
    icon: 'notion',
    url: 'https://notion.so',
    aliases: ['notion.so', 'notion labs'],
  },
  slack: {
    category: 'productivity',
    icon: 'slack',
    url: 'https://slack.com',
    aliases: ['slack.com', 'slack technologies'],
  },
  zoom: {
    category: 'productivity',
    icon: 'zoom',
    url: 'https://zoom.us',
    aliases: ['zoom.us', 'zoom video'],
  },
  'new york times': {
    category: 'news',
    icon: 'nyt',
    url: 'https://nytimes.com',
    aliases: ['nytimes', 'nyt', 'nytimes.com'],
  },
  'wall street journal': {
    category: 'news',
    icon: 'wsj',
    url: 'https://wsj.com',
    aliases: ['wsj', 'wsj.com', 'dow jones'],
  },
  'uber eats': {
    category: 'food_delivery',
    icon: 'uber',
    url: 'https://ubereats.com',
    aliases: ['ubereats', 'uber eats'],
  },
  doordash: {
    category: 'food_delivery',
    icon: 'doordash',
    url: 'https://doordash.com',
    aliases: ['doordash.com', 'dashpass'],
  },
  rappi: {
    category: 'food_delivery',
    icon: 'rappi',
    url: 'https://rappi.com',
    aliases: ['rappi.com', 'rappi prime'],
  },
  peloton: {
    category: 'fitness',
    icon: 'peloton',
    url: 'https://onepeloton.com',
    aliases: ['peloton', 'onepeloton'],
  },
  headspace: {
    category: 'fitness',
    icon: 'headspace',
    url: 'https://headspace.com',
    aliases: ['headspace.com', 'headspace inc'],
  },
  duolingo: {
    category: 'education',
    icon: 'duolingo',
    url: 'https://duolingo.com',
    aliases: ['duolingo.com', 'duolingo plus'],
  },
  coursera: {
    category: 'education',
    icon: 'coursera',
    url: 'https://coursera.org',
    aliases: ['coursera.org', 'coursera plus'],
  },
};

interface DetectedSubscription {
  serviceName: string;
  amount: number;
  currency: Currency;
  billingCycle: RecurrenceFrequency;
  category: SubscriptionCategory;
  serviceUrl?: string;
  serviceIcon?: string;
  recurringId: string;
  confidence: number;
  lastBillingDate?: Date;
  nextBillingDate?: Date;
}

@Injectable()
export class SubscriptionDetectorService {
  private readonly logger = new Logger(SubscriptionDetectorService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Detect subscriptions from confirmed recurring transactions
   */
  async detectSubscriptions(spaceId: string): Promise<DetectedSubscription[]> {
    this.logger.log(`Detecting subscriptions for space: ${spaceId}`);

    // Get confirmed recurring patterns that don't have a subscription yet
    const recurringPatterns = await this.prisma.recurringTransaction.findMany({
      where: {
        spaceId,
        status: 'confirmed',
        subscription: null,
      },
      orderBy: { confidence: 'desc' },
    });

    const detectedSubscriptions: DetectedSubscription[] = [];

    for (const pattern of recurringPatterns) {
      const subscription = this.analyzeAsSubscription(pattern);
      if (subscription) {
        detectedSubscriptions.push(subscription);
      }
    }

    this.logger.log(
      `Detected ${detectedSubscriptions.length} potential subscriptions for space: ${spaceId}`
    );
    return detectedSubscriptions;
  }

  /**
   * Analyze a recurring pattern to determine if it's a subscription
   */
  private analyzeAsSubscription(pattern: {
    id: string;
    merchantName: string;
    expectedAmount: unknown;
    currency: Currency;
    frequency: RecurrenceFrequency;
    confidence: unknown;
    lastOccurrence: Date | null;
    nextExpected: Date | null;
  }): DetectedSubscription | null {
    const merchantLower = pattern.merchantName.toLowerCase();

    // Check against known services
    for (const [serviceName, serviceInfo] of Object.entries(KNOWN_SERVICES)) {
      const isMatch =
        merchantLower.includes(serviceName) ||
        serviceInfo.aliases.some((alias) => merchantLower.includes(alias.toLowerCase()));

      if (isMatch) {
        return {
          serviceName: this.formatServiceName(serviceName),
          amount: Number(pattern.expectedAmount),
          currency: pattern.currency,
          billingCycle: pattern.frequency,
          category: serviceInfo.category,
          serviceUrl: serviceInfo.url,
          serviceIcon: serviceInfo.icon,
          recurringId: pattern.id,
          confidence: Number(pattern.confidence),
          lastBillingDate: pattern.lastOccurrence || undefined,
          nextBillingDate: pattern.nextExpected || undefined,
        };
      }
    }

    // Heuristic detection for unknown services
    // Subscriptions typically have fixed amounts and monthly/yearly billing
    const isLikelySubscription =
      (pattern.frequency === 'monthly' || pattern.frequency === 'yearly') &&
      Number(pattern.confidence) >= 0.7 &&
      this.looksLikeSubscription(merchantLower);

    if (isLikelySubscription) {
      return {
        serviceName: this.formatServiceName(pattern.merchantName),
        amount: Number(pattern.expectedAmount),
        currency: pattern.currency,
        billingCycle: pattern.frequency,
        category: this.guessCategory(merchantLower),
        recurringId: pattern.id,
        confidence: Number(pattern.confidence) * 0.8, // Lower confidence for unknown services
        lastBillingDate: pattern.lastOccurrence || undefined,
        nextBillingDate: pattern.nextExpected || undefined,
      };
    }

    return null;
  }

  /**
   * Check if merchant name looks like a subscription service
   */
  private looksLikeSubscription(merchantLower: string): boolean {
    const subscriptionIndicators = [
      'subscription',
      'monthly',
      'annual',
      'premium',
      'pro',
      'plus',
      'membership',
      '.com',
      '.io',
      'app',
      'cloud',
      'online',
      'digital',
      'media',
      'entertainment',
      'streaming',
    ];

    return subscriptionIndicators.some((indicator) => merchantLower.includes(indicator));
  }

  /**
   * Guess category based on merchant name
   */
  private guessCategory(merchantLower: string): SubscriptionCategory {
    const categoryKeywords: Record<SubscriptionCategory, string[]> = {
      streaming: ['stream', 'video', 'movie', 'tv', 'watch', 'entertainment'],
      music: ['music', 'audio', 'podcast', 'radio'],
      software: ['software', 'saas', 'tool', 'app', 'dev', 'code'],
      gaming: ['game', 'gaming', 'xbox', 'playstation', 'nintendo', 'steam'],
      news: ['news', 'times', 'journal', 'post', 'tribune', 'magazine'],
      fitness: ['fitness', 'gym', 'workout', 'health', 'wellness', 'meditation'],
      food_delivery: ['food', 'delivery', 'eats', 'meal', 'restaurant'],
      cloud_storage: ['cloud', 'storage', 'backup', 'drive', 'sync'],
      productivity: ['productivity', 'office', 'work', 'team', 'project'],
      education: ['learn', 'education', 'course', 'class', 'study', 'language'],
      finance: ['finance', 'invest', 'trade', 'bank', 'money'],
      other: [],
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some((keyword) => merchantLower.includes(keyword))) {
        return category as SubscriptionCategory;
      }
    }

    return 'other';
  }

  /**
   * Format service name for display
   */
  private formatServiceName(name: string): string {
    return name
      .split(/[\s_-]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Calculate annual cost based on billing cycle
   */
  calculateAnnualCost(amount: number, billingCycle: RecurrenceFrequency): number {
    const multipliers: Record<RecurrenceFrequency, number> = {
      daily: 365,
      weekly: 52,
      biweekly: 26,
      monthly: 12,
      quarterly: 4,
      yearly: 1,
    };

    return Math.round(amount * multipliers[billingCycle] * 100) / 100;
  }

  /**
   * Generate savings recommendations based on usage
   */
  generateSavingsRecommendation(
    serviceName: string,
    usageFrequency: string | null,
    annualCost: number
  ): string | null {
    if (!usageFrequency || usageFrequency === 'unknown') {
      return null;
    }

    if (usageFrequency === 'low') {
      return `Consider cancelling ${serviceName} - you could save $${annualCost.toFixed(2)}/year with low usage.`;
    }

    if (usageFrequency === 'medium' && annualCost > SUBSCRIPTION.ANNUAL_COST_WARNING_USD) {
      return `Look for annual billing discounts for ${serviceName} - many services offer 15-20% off.`;
    }

    return null;
  }

  /**
   * Get status based on trial and dates
   */
  determineStatus(
    trialEndDate: Date | null,
    cancelledAt: Date | null,
    endDate: Date | null
  ): SubscriptionStatus {
    const now = new Date();

    if (cancelledAt) {
      return 'cancelled';
    }

    if (endDate && endDate < now) {
      return 'expired';
    }

    if (trialEndDate && trialEndDate > now) {
      return 'trial';
    }

    return 'active';
  }
}
