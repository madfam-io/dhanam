import { validateEmail, validatePassword, getPasswordStrength } from '../validation';

describe('validateEmail', () => {
  it('should accept valid email addresses', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('user.name@domain.co')).toBe(true);
    expect(validateEmail('user+tag@domain.com')).toBe(true);
  });

  it('should reject invalid email addresses', () => {
    expect(validateEmail('')).toBe(false);
    expect(validateEmail('notanemail')).toBe(false);
    expect(validateEmail('@domain.com')).toBe(false);
    expect(validateEmail('user@')).toBe(false);
    expect(validateEmail('user @domain.com')).toBe(false);
  });
});

describe('validatePassword', () => {
  it('should accept valid passwords', () => {
    expect(validatePassword('Password1')).toBe(true);
    expect(validatePassword('SecurePass123')).toBe(true);
    expect(validatePassword('MyP4ssw0rd')).toBe(true);
  });

  it('should reject passwords shorter than 8 characters', () => {
    expect(validatePassword('Pass1')).toBe(false);
    expect(validatePassword('Ab1')).toBe(false);
  });

  it('should reject passwords without uppercase', () => {
    expect(validatePassword('password1')).toBe(false);
  });

  it('should reject passwords without lowercase', () => {
    expect(validatePassword('PASSWORD1')).toBe(false);
  });

  it('should reject passwords without numbers', () => {
    expect(validatePassword('PasswordOnly')).toBe(false);
  });
});

describe('getPasswordStrength', () => {
  it('should return "weak" for short passwords', () => {
    expect(getPasswordStrength('short')).toBe('weak');
    expect(getPasswordStrength('abc')).toBe('weak');
  });

  it('should return "weak" for simple passwords', () => {
    expect(getPasswordStrength('password')).toBe('weak');
    expect(getPasswordStrength('12345678')).toBe('weak');
  });

  it('should return "medium" for passwords with 3 criteria', () => {
    expect(getPasswordStrength('Password1')).toBe('medium');
    expect(getPasswordStrength('Abcdefg1')).toBe('medium');
  });

  it('should return "strong" for passwords with all 4 criteria', () => {
    expect(getPasswordStrength('Password1!')).toBe('strong');
    expect(getPasswordStrength('S3cure!Pass')).toBe('strong');
  });
});
