jest.unmock('@/utils/currency');

import {
  formatCurrency,
  getCurrencySymbol,
  formatPercentage,
  formatCompactNumber,
} from '../currency';

describe('formatCurrency', () => {
  it('should format USD amounts', () => {
    const result = formatCurrency(1234.56, 'USD');
    expect(result).toContain('1,234.56');
    expect(result).toContain('$');
  });

  it('should format MXN amounts', () => {
    const result = formatCurrency(5000, 'MXN', 'es-MX');
    expect(result).toBeDefined();
  });

  it('should handle zero amounts', () => {
    const result = formatCurrency(0, 'USD');
    expect(result).toContain('0.00');
  });

  it('should handle negative amounts', () => {
    const result = formatCurrency(-50.25, 'USD');
    expect(result).toContain('50.25');
  });

  it('should default to USD', () => {
    const result = formatCurrency(100);
    expect(result).toContain('100.00');
  });

  it('should use fallback formatting for unsupported currencies', () => {
    // This tests the catch block when Intl.NumberFormat fails
    const result = formatCurrency(100, 'INVALID_CURRENCY_CODE_THAT_SHOULD_FAIL');
    expect(result).toBeDefined();
  });
});

describe('getCurrencySymbol', () => {
  it('should return $ for USD', () => {
    expect(getCurrencySymbol('USD')).toBe('$');
  });

  it('should return $ for MXN', () => {
    expect(getCurrencySymbol('MXN')).toBe('$');
  });

  it('should return the currency code for unknown currencies', () => {
    expect(getCurrencySymbol('XYZ')).toBe('XYZ');
  });

  it('should return correct symbols for supported currencies', () => {
    expect(getCurrencySymbol('EUR')).toBe('\u20AC');
    expect(getCurrencySymbol('GBP')).toBe('\u00A3');
    expect(getCurrencySymbol('JPY')).toBe('\u00A5');
    expect(getCurrencySymbol('BRL')).toBe('R$');
  });
});

describe('formatPercentage', () => {
  it('should format with default 1 decimal', () => {
    expect(formatPercentage(85.456)).toBe('85.5%');
  });

  it('should format with custom decimals', () => {
    expect(formatPercentage(85.456, 2)).toBe('85.46%');
  });

  it('should handle zero', () => {
    expect(formatPercentage(0)).toBe('0.0%');
  });
});

describe('formatCompactNumber', () => {
  it('should format billions', () => {
    expect(formatCompactNumber(1500000000)).toBe('1.5B');
  });

  it('should format millions', () => {
    expect(formatCompactNumber(2500000)).toBe('2.5M');
  });

  it('should format thousands', () => {
    expect(formatCompactNumber(15000)).toBe('15.0K');
  });

  it('should format small numbers', () => {
    expect(formatCompactNumber(500)).toBe('500');
  });

  it('should handle negative numbers', () => {
    expect(formatCompactNumber(-1500000)).toBe('-1.5M');
  });
});
