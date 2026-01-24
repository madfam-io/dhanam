import {
  validateEmail,
  validatePassword,
  emailSchema,
  passwordSchema,
  uuidSchema,
} from '../utils/validation';

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('test.user@domain.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.org')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('missing@')).toBe(false);
      expect(validateEmail('@nodomain.com')).toBe(false);
      expect(validateEmail('spaces in@email.com')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(validateEmail('')).toBe(false);
    });

    it('should handle emails with numbers', () => {
      expect(validateEmail('user123@example.com')).toBe(true);
    });

    it('should handle subdomains', () => {
      expect(validateEmail('user@mail.subdomain.example.com')).toBe(true);
    });
  });

  describe('validatePassword', () => {
    it('should validate passwords with 8+ characters', () => {
      expect(validatePassword('password123')).toBe(true);
      expect(validatePassword('12345678')).toBe(true);
      expect(validatePassword('abcdefgh')).toBe(true);
    });

    it('should reject passwords with less than 8 characters', () => {
      expect(validatePassword('short')).toBe(false);
      expect(validatePassword('1234567')).toBe(false);
      expect(validatePassword('')).toBe(false);
    });

    it('should accept exactly 8 characters', () => {
      expect(validatePassword('12345678')).toBe(true);
    });

    it('should accept long passwords', () => {
      expect(validatePassword('a'.repeat(100))).toBe(true);
    });

    it('should accept passwords with special characters', () => {
      expect(validatePassword('pass@#$%word')).toBe(true);
    });

    it('should accept passwords with spaces', () => {
      expect(validatePassword('pass word')).toBe(true);
    });
  });

  describe('emailSchema', () => {
    it('should parse valid emails', () => {
      const result = emailSchema.safeParse('user@example.com');
      expect(result.success).toBe(true);
    });

    it('should fail for invalid emails', () => {
      const result = emailSchema.safeParse('not-an-email');
      expect(result.success).toBe(false);
    });

    it('should provide error message for invalid emails', () => {
      const result = emailSchema.safeParse('invalid');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });
  });

  describe('passwordSchema', () => {
    it('should parse valid passwords', () => {
      const result = passwordSchema.safeParse('validpassword');
      expect(result.success).toBe(true);
    });

    it('should fail for short passwords', () => {
      const result = passwordSchema.safeParse('short');
      expect(result.success).toBe(false);
    });

    it('should provide error message for short passwords', () => {
      const result = passwordSchema.safeParse('abc');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('8');
      }
    });
  });

  describe('uuidSchema', () => {
    it('should parse valid UUIDs', () => {
      const result = uuidSchema.safeParse('550e8400-e29b-41d4-a716-446655440000');
      expect(result.success).toBe(true);
    });

    it('should parse v4 UUIDs', () => {
      const result = uuidSchema.safeParse('f47ac10b-58cc-4372-a567-0e02b2c3d479');
      expect(result.success).toBe(true);
    });

    it('should fail for invalid UUIDs', () => {
      expect(uuidSchema.safeParse('not-a-uuid').success).toBe(false);
      expect(uuidSchema.safeParse('').success).toBe(false);
      expect(uuidSchema.safeParse('12345').success).toBe(false);
    });

    it('should fail for UUID with wrong format', () => {
      const result = uuidSchema.safeParse('550e8400e29b41d4a716446655440000'); // No hyphens
      expect(result.success).toBe(false);
    });
  });
});
