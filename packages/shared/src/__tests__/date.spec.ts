import { formatDate, startOfMonth, endOfMonth } from '../utils/date';

describe('Date Utilities', () => {
  describe('formatDate', () => {
    it('should format date with default format (yyyy-MM-dd)', () => {
      // Use explicit local time to avoid timezone issues
      const date = new Date(2025, 10, 17); // November 17, 2025 (month is 0-indexed)
      const result = formatDate(date);
      expect(result).toBe('2025-11-17');
    });

    it('should format date with custom format', () => {
      const date = new Date(2025, 10, 17);
      const result = formatDate(date, 'dd/MM/yyyy');
      expect(result).toBe('17/11/2025');
    });

    it('should format date with month name', () => {
      const date = new Date(2025, 10, 17);
      const result = formatDate(date, 'MMMM dd, yyyy');
      expect(result).toBe('November 17, 2025');
    });

    it('should format date with short month', () => {
      const date = new Date(2025, 10, 17);
      const result = formatDate(date, 'MMM dd, yyyy');
      expect(result).toBe('Nov 17, 2025');
    });

    it('should format date with time', () => {
      const date = new Date(2025, 10, 17, 14, 30, 0);
      const result = formatDate(date, 'yyyy-MM-dd HH:mm');
      expect(result).toContain('14:30');
    });

    it('should handle January date', () => {
      const date = new Date(2025, 0, 1); // January 1, 2025
      const result = formatDate(date);
      expect(result).toBe('2025-01-01');
    });

    it('should handle December date', () => {
      const date = new Date(2025, 11, 31); // December 31, 2025
      const result = formatDate(date);
      expect(result).toBe('2025-12-31');
    });
  });

  describe('startOfMonth', () => {
    it('should return first day of current month', () => {
      const date = new Date(2025, 10, 17); // November 17, 2025
      const result = startOfMonth(date);

      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(10); // November (0-indexed)
      expect(result.getDate()).toBe(1);
    });

    it('should handle January', () => {
      const date = new Date(2025, 0, 15); // January 15, 2025
      const result = startOfMonth(date);

      expect(result.getMonth()).toBe(0);
      expect(result.getDate()).toBe(1);
    });

    it('should handle December', () => {
      const date = new Date(2025, 11, 25); // December 25, 2025
      const result = startOfMonth(date);

      expect(result.getMonth()).toBe(11);
      expect(result.getDate()).toBe(1);
    });

    it('should use current date when no argument provided', () => {
      const result = startOfMonth();
      expect(result.getDate()).toBe(1);
    });

    it('should preserve year', () => {
      const date = new Date(2020, 5, 15); // June 15, 2020
      const result = startOfMonth(date);
      expect(result.getFullYear()).toBe(2020);
    });
  });

  describe('endOfMonth', () => {
    it('should return last day of month', () => {
      const date = new Date(2025, 10, 17); // November 17, 2025
      const result = endOfMonth(date);

      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(10); // November (0-indexed)
      expect(result.getDate()).toBe(30); // November has 30 days
    });

    it('should handle 31-day months', () => {
      const date = new Date(2025, 0, 15); // January 15, 2025
      const result = endOfMonth(date);
      expect(result.getDate()).toBe(31);
    });

    it('should handle February in non-leap year', () => {
      const date = new Date(2025, 1, 15); // February 15, 2025
      const result = endOfMonth(date);
      expect(result.getDate()).toBe(28);
    });

    it('should handle February in leap year', () => {
      const date = new Date(2024, 1, 15); // February 15, 2024
      const result = endOfMonth(date);
      expect(result.getDate()).toBe(29);
    });

    it('should handle December', () => {
      const date = new Date(2025, 11, 15); // December 15, 2025
      const result = endOfMonth(date);
      expect(result.getDate()).toBe(31);
    });

    it('should use current date when no argument provided', () => {
      const result = endOfMonth();
      // Just verify it returns a valid date
      expect(result.getDate()).toBeGreaterThanOrEqual(28);
      expect(result.getDate()).toBeLessThanOrEqual(31);
    });

    it('should handle April (30 days)', () => {
      const date = new Date(2025, 3, 15); // April 15, 2025
      const result = endOfMonth(date);
      expect(result.getDate()).toBe(30);
    });
  });
});
