import {
  formatCurrency,
  formatDate,
  formatDateShort,
  formatDateTime,
  formatRelativeTime,
  formatNumber,
  formatPercentage,
  formatCompactNumber,
  formatTimespan,
  formatFileSize,
  parseCurrency,
  getCurrencySymbol,
  formatTransactionAmount,
  formatESGScore,
} from '../utils/formatters';

describe('Formatters', () => {
  describe('formatCurrency', () => {
    it('should format MXN currency in Spanish locale', () => {
      const result = formatCurrency(1234.56, 'MXN', 'es');
      expect(result).toContain('1');
      expect(result).toContain('234');
      expect(result).toContain('56');
    });

    it('should format USD currency in English locale', () => {
      const result = formatCurrency(1234.56, 'USD', 'en');
      expect(result).toContain('$');
      expect(result).toContain('1,234.56');
    });

    it('should format EUR currency', () => {
      const result = formatCurrency(1234.56, 'EUR', 'en');
      // May contain either € symbol or EUR code depending on locale
      expect(result.includes('€') || result.includes('EUR')).toBe(true);
    });

    it('should format BTC with up to 8 decimals', () => {
      const result = formatCurrency(0.00123456, 'BTC', 'en');
      expect(result).toContain('BTC');
      expect(result).toContain('0.00123456');
    });

    it('should format ETH with up to 8 decimals', () => {
      const result = formatCurrency(1.23456789, 'ETH', 'es');
      expect(result).toContain('ETH');
    });

    it('should default to MXN and Spanish locale', () => {
      const result = formatCurrency(1000);
      expect(result).toBeDefined();
    });
  });

  describe('formatDate', () => {
    it('should format date in Spanish locale', () => {
      const date = new Date('2025-11-17');
      const result = formatDate(date, 'es');
      expect(result).toMatch(/noviembre|2025/i);
    });

    it('should format date in English locale', () => {
      const date = new Date('2025-11-17');
      const result = formatDate(date, 'en');
      expect(result).toMatch(/November|2025/i);
    });

    it('should accept string dates', () => {
      const result = formatDate('2025-11-17', 'en');
      expect(result).toBeDefined();
    });

    it('should accept custom format options', () => {
      const date = new Date('2025-11-17');
      const result = formatDate(date, 'en', { year: '2-digit', month: 'short' });
      expect(result).toBeDefined();
    });
  });

  describe('formatDateShort', () => {
    it('should format as short date in Spanish locale', () => {
      const date = new Date('2025-11-17');
      const result = formatDateShort(date, 'es');
      // Should be DD/MM/YYYY format
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });

    it('should format as short date in English locale', () => {
      const date = new Date('2025-11-17');
      const result = formatDateShort(date, 'en');
      // Should be MM/DD/YYYY format
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });

    it('should accept string dates', () => {
      const result = formatDateShort('2025-11-17');
      expect(result).toBeDefined();
    });
  });

  describe('formatDateTime', () => {
    it('should format date and time in Spanish locale', () => {
      const date = new Date('2025-11-17T14:30:00');
      const result = formatDateTime(date, 'es');
      expect(result).toContain('2025');
    });

    it('should format date and time in English locale', () => {
      const date = new Date('2025-11-17T14:30:00');
      const result = formatDateTime(date, 'en');
      expect(result).toBeDefined();
    });
  });

  describe('formatRelativeTime', () => {
    it('should format relative time in Spanish', () => {
      const result = formatRelativeTime(-2, 'day', 'es');
      // Spanish may use "anteayer", "hace 2 días", etc.
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should format relative time in English', () => {
      const result = formatRelativeTime(-2, 'day', 'en');
      // English may use "2 days ago" or similar
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle future times', () => {
      const result = formatRelativeTime(3, 'month', 'en');
      expect(result).toBeDefined();
    });
  });

  describe('formatNumber', () => {
    it('should format number with locale-specific separators', () => {
      const result = formatNumber(1234567.89, 'en');
      expect(result).toContain('1,234,567');
    });

    it('should accept format options', () => {
      const result = formatNumber(1234.5678, 'en', { maximumFractionDigits: 2 });
      expect(result).toBe('1,234.57');
    });

    it('should default to Spanish locale', () => {
      const result = formatNumber(1234);
      expect(result).toBeDefined();
    });
  });

  describe('formatPercentage', () => {
    it('should format decimal as percentage', () => {
      const result = formatPercentage(0.1234, 'en');
      expect(result).toBe('12.34%');
    });

    it('should respect decimal places', () => {
      const result = formatPercentage(0.1234, 'en', 1);
      expect(result).toBe('12.3%');
    });

    it('should handle 100%', () => {
      const result = formatPercentage(1, 'en');
      expect(result).toBe('100.00%');
    });

    it('should handle 0%', () => {
      const result = formatPercentage(0, 'en');
      expect(result).toBe('0.00%');
    });
  });

  describe('formatCompactNumber', () => {
    it('should format thousands as K', () => {
      const result = formatCompactNumber(1500, 'en');
      expect(result.toLowerCase()).toMatch(/k|1\.5/);
    });

    it('should format millions as M', () => {
      const result = formatCompactNumber(1500000, 'en');
      expect(result.toLowerCase()).toMatch(/m|1\.5/);
    });

    it('should format billions as B', () => {
      const result = formatCompactNumber(1500000000, 'en');
      expect(result.toLowerCase()).toMatch(/b|1\.5/);
    });
  });

  describe('formatTimespan', () => {
    it('should format seconds only', () => {
      const result = formatTimespan(45, 'en');
      expect(result).toBe('45s');
    });

    it('should format minutes and seconds', () => {
      const result = formatTimespan(90, 'en');
      expect(result).toBe('1m 30s');
    });

    it('should format hours, minutes, and seconds', () => {
      const result = formatTimespan(3661, 'en');
      expect(result).toBe('1h 1m 1s');
    });

    it('should handle zero seconds', () => {
      const result = formatTimespan(0, 'en');
      expect(result).toBe('0s');
    });

    it('should handle hours only', () => {
      const result = formatTimespan(3600, 'en');
      expect(result).toBe('1h');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      const result = formatFileSize(500, 'en');
      expect(result).toContain('500');
      expect(result).toContain('B');
    });

    it('should format kilobytes', () => {
      const result = formatFileSize(1536, 'en');
      expect(result).toContain('1.5');
      expect(result).toContain('KB');
    });

    it('should format megabytes', () => {
      const result = formatFileSize(1536 * 1024, 'en');
      expect(result).toContain('1.5');
      expect(result).toContain('MB');
    });

    it('should format gigabytes', () => {
      const result = formatFileSize(1536 * 1024 * 1024, 'en');
      expect(result).toContain('1.5');
      expect(result).toContain('GB');
    });
  });

  describe('parseCurrency', () => {
    it('should parse formatted currency string', () => {
      expect(parseCurrency('$1,234.56')).toBe(1234.56);
    });

    it('should parse negative amounts', () => {
      expect(parseCurrency('-$1,234.56')).toBe(-1234.56);
    });

    it('should handle currency symbols', () => {
      expect(parseCurrency('€1.234,56')).toBeGreaterThan(0);
    });

    it('should return 0 for invalid strings', () => {
      expect(parseCurrency('invalid')).toBe(0);
    });

    it('should handle plain numbers', () => {
      expect(parseCurrency('1234.56')).toBe(1234.56);
    });
  });

  describe('getCurrencySymbol', () => {
    it('should return $ for MXN', () => {
      const symbol = getCurrencySymbol('MXN', 'es');
      expect(symbol).toContain('$');
    });

    it('should return $ for USD', () => {
      const symbol = getCurrencySymbol('USD', 'en');
      expect(symbol).toContain('$');
    });

    it('should return € for EUR', () => {
      const symbol = getCurrencySymbol('EUR', 'en');
      expect(symbol).toContain('€');
    });

    it('should return BTC for Bitcoin', () => {
      const symbol = getCurrencySymbol('BTC', 'en');
      expect(symbol).toBe('BTC');
    });

    it('should return ETH for Ethereum', () => {
      const symbol = getCurrencySymbol('ETH', 'en');
      expect(symbol).toBe('ETH');
    });
  });

  describe('formatTransactionAmount', () => {
    it('should add + sign for positive amounts', () => {
      const result = formatTransactionAmount(150, 'USD', 'en');
      expect(result).toContain('+');
    });

    it('should not add + for negative amounts', () => {
      const result = formatTransactionAmount(-150, 'USD', 'en');
      expect(result).not.toMatch(/^\+/);
    });

    it('should include currency formatting', () => {
      const result = formatTransactionAmount(150, 'MXN', 'es');
      expect(result).toBeDefined();
    });
  });

  describe('formatESGScore', () => {
    it('should format with one decimal place', () => {
      expect(formatESGScore(85.5)).toBe('85.5');
    });

    it('should round to one decimal place', () => {
      expect(formatESGScore(85.56)).toBe('85.6');
    });

    it('should handle whole numbers', () => {
      expect(formatESGScore(85)).toBe('85.0');
    });

    it('should handle zero', () => {
      expect(formatESGScore(0)).toBe('0.0');
    });

    it('should handle 100', () => {
      expect(formatESGScore(100)).toBe('100.0');
    });
  });
});
