import { Injectable } from '@nestjs/common';

/**
 * Merchant name normalization service
 * Cleans up and standardizes merchant names for better pattern matching
 */
@Injectable()
export class MerchantNormalizerService {
  // Common merchant suffixes to remove
  private readonly suffixPatterns = [
    /\s*#\s*\d+$/i, // Store numbers: "Walmart #1234"
    /\s*store\s*#?\s*\d+$/i, // "Target Store 456"
    /\s*-\s*\d+$/i, // Trailing numbers: "Starbucks - 789"
    /\s*\(\d+\)$/i, // Parenthetical numbers: "McDonalds (123)"
    /\s*loc\s*#?\s*\d+$/i, // Location numbers
    /\s+\d{4,}$/i, // Trailing long numbers (4+ digits)
    /\s*\/\s*\d+$/i, // Slash numbers: "Store / 123"
  ];

  // Location patterns to remove
  private readonly locationPatterns = [
    /\s+[A-Z]{2}\s*\d{5}(-\d{4})?$/i, // State + ZIP: "CA 90210"
    /\s+\d{5}(-\d{4})?$/i, // ZIP codes: "90210" or "90210-1234"
    /\s*,\s*[A-Z]{2}$/i, // State abbreviation: ", CA"
    /\s*,\s*[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/i, // City names: ", Los Angeles"
    /\s+-\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/i, // City with dash: " - New York"
  ];

  // Common transaction prefixes to normalize
  private readonly prefixMappings: Record<string, string> = {
    'pos debit': '',
    'pos purchase': '',
    'debit card purchase': '',
    'check card purchase': '',
    'visa purchase': '',
    'mc purchase': '',
    'mastercard purchase': '',
    'amex purchase': '',
    'recurring payment': '',
    'automatic payment': '',
    'bill pay': '',
    'online transfer': '',
    'wire transfer': '',
    'ach debit': '',
    'ach credit': '',
    'direct debit': '',
    'paypal *': 'PayPal',
    'paypal inst xfer': 'PayPal',
    'venmo cashout': 'Venmo',
    'zelle payment': 'Zelle',
    'sq *': 'Square',
    'tst*': '',
    'ach withdrawal': '',
  };

  // Known merchant name mappings for standardization
  private readonly merchantMappings: Record<string, string> = {
    'amzn mktp': 'Amazon',
    'amazon.com': 'Amazon',
    'amazon mktplace': 'Amazon',
    'amazon prime': 'Amazon Prime',
    'amzn digital': 'Amazon',
    wmt: 'Walmart',
    'wal-mart': 'Walmart',
    'walgreens #': 'Walgreens',
    'cvs/pharmacy': 'CVS',
    "mcdonald's": 'McDonalds',
    'burger king': 'Burger King',
    'chick-fil-a': 'Chick-fil-A',
    'chipotle online': 'Chipotle',
    'dunkin #': 'Dunkin',
    "dunkin'": 'Dunkin',
    sbux: 'Starbucks',
    uber: 'Uber',
    'uber trip': 'Uber',
    'uber eats': 'Uber Eats',
    'uber *eats': 'Uber Eats',
    lyft: 'Lyft',
    'lyft *ride': 'Lyft',
    doordash: 'DoorDash',
    grubhub: 'Grubhub',
    instacart: 'Instacart',
    netflix: 'Netflix',
    'netflix.com': 'Netflix',
    spotify: 'Spotify',
    'spotify usa': 'Spotify',
    hulu: 'Hulu',
    'disney plus': 'Disney+',
    disneyplus: 'Disney+',
    'hbo max': 'HBO Max',
    'apple.com/bill': 'Apple',
    'apple music': 'Apple Music',
    'google *': 'Google',
    'google play': 'Google Play',
    'google storage': 'Google',
    'github inc': 'GitHub',
    dropbox: 'Dropbox',
    'microsoft *': 'Microsoft',
    'msft *': 'Microsoft',
    'adobe *': 'Adobe',
    'zoom.us': 'Zoom',
    'slack technologies': 'Slack',
  };

  /**
   * Normalize a merchant name for pattern matching
   */
  normalize(merchantName: string | null | undefined): string {
    if (!merchantName) return '';

    let normalized = merchantName.trim();

    // Apply prefix mappings (case insensitive)
    const lowerNormalized = normalized.toLowerCase();
    for (const [prefix, replacement] of Object.entries(this.prefixMappings)) {
      if (lowerNormalized.startsWith(prefix)) {
        normalized = replacement + normalized.slice(prefix.length).trim();
        break;
      }
    }

    // Remove store numbers and location patterns
    for (const pattern of this.suffixPatterns) {
      normalized = normalized.replace(pattern, '');
    }
    for (const pattern of this.locationPatterns) {
      normalized = normalized.replace(pattern, '');
    }

    // Clean up extra whitespace
    normalized = normalized.replace(/\s+/g, ' ').trim();

    // Apply known merchant mappings
    const lowerForMapping = normalized.toLowerCase();
    for (const [pattern, standardName] of Object.entries(this.merchantMappings)) {
      if (lowerForMapping.includes(pattern.toLowerCase())) {
        return standardName;
      }
    }

    // Title case the result if no mapping found
    return this.toTitleCase(normalized);
  }

  /**
   * Extract a pattern key from a merchant name for learning
   * This is a more aggressive normalization for pattern storage
   */
  extractPatternKey(merchantName: string | null | undefined): string {
    const normalized = this.normalize(merchantName);

    // Remove all special characters and numbers
    let patternKey = normalized.replace(/[^a-zA-Z\s]/g, '');

    // Remove common words that don't help with identification
    const stopWords = [
      'inc',
      'corp',
      'llc',
      'ltd',
      'co',
      'company',
      'store',
      'shop',
      'market',
      'online',
      'the',
    ];
    const words = patternKey.toLowerCase().split(/\s+/);
    patternKey = words.filter((w) => w.length > 2 && !stopWords.includes(w)).join(' ');

    return patternKey.trim();
  }

  /**
   * Extract key terms from a transaction description for pattern matching
   */
  extractDescriptionTerms(description: string): string[] {
    const stopWords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'from',
      'as',
      'is',
      'it',
      'that',
      'this',
      'pos',
      'debit',
      'credit',
      'card',
      'purchase',
      'payment',
      'transfer',
    ]);

    return description
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.has(word))
      .slice(0, 5); // Keep top 5 terms
  }

  /**
   * Check if two merchant names are likely the same after normalization
   */
  isSameMerchant(
    merchant1: string | null | undefined,
    merchant2: string | null | undefined
  ): boolean {
    const normalized1 = this.normalize(merchant1);
    const normalized2 = this.normalize(merchant2);

    if (!normalized1 || !normalized2) return false;

    return normalized1.toLowerCase() === normalized2.toLowerCase();
  }

  /**
   * Convert string to title case
   */
  private toTitleCase(str: string): string {
    return str
      .toLowerCase()
      .split(' ')
      .map((word) => (word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1) : ''))
      .join(' ');
  }

  /**
   * Detect merchant category from name (basic heuristics)
   */
  detectCategory(merchantName: string): string | null {
    const lower = merchantName.toLowerCase();

    const categoryPatterns: Record<string, string[]> = {
      'Food & Dining': [
        'restaurant',
        'cafe',
        'coffee',
        'pizza',
        'burger',
        'taco',
        'sushi',
        'grill',
        'kitchen',
        'bakery',
        'deli',
        'doordash',
        'uber eats',
        'grubhub',
        'instacart',
      ],
      Groceries: [
        'grocery',
        'supermarket',
        'whole foods',
        'trader joe',
        'safeway',
        'kroger',
        'publix',
        'costco',
        'walmart',
        'target',
      ],
      Transportation: [
        'uber',
        'lyft',
        'taxi',
        'parking',
        'gas',
        'fuel',
        'shell',
        'chevron',
        'exxon',
        'bp',
      ],
      Entertainment: [
        'netflix',
        'spotify',
        'hulu',
        'disney',
        'hbo',
        'cinema',
        'theater',
        'movie',
        'game',
      ],
      Shopping: ['amazon', 'ebay', 'etsy', 'mall', 'store', 'outlet'],
      Utilities: [
        'electric',
        'water',
        'gas',
        'internet',
        'cable',
        'phone',
        'att',
        'verizon',
        't-mobile',
      ],
      Healthcare: [
        'pharmacy',
        'cvs',
        'walgreens',
        'doctor',
        'hospital',
        'medical',
        'dental',
        'vision',
      ],
      'Software & Tech': [
        'github',
        'dropbox',
        'google',
        'microsoft',
        'adobe',
        'zoom',
        'slack',
        'aws',
      ],
    };

    for (const [category, patterns] of Object.entries(categoryPatterns)) {
      if (patterns.some((pattern) => lower.includes(pattern))) {
        return category;
      }
    }

    return null;
  }
}
