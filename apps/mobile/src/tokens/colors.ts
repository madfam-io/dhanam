/**
 * DHANAM Mobile Design Token System
 *
 * Semantic color tokens for consistent UI across the React Native application.
 * Use these tokens instead of hardcoded hex colors.
 *
 * Usage:
 * import { colors } from '@/tokens/colors';
 * style={{ color: colors.semantic.success }}
 */

/**
 * Semantic status colors for feedback and state indication
 */
export const semanticColors = {
  success: '#22C55E',
  successDark: '#16A34A',
  error: '#EF4444',
  errorDark: '#DC2626',
  warning: '#F59E0B',
  warningDark: '#D97706',
  info: '#3B82F6',
  infoDark: '#2563EB',
} as const;

/**
 * Financial context colors for transaction types
 */
export const financialColors = {
  income: '#22C55E',
  expense: '#EF4444',
  transfer: '#3B82F6',
  neutral: '#6B7280',
} as const;

/**
 * Goal health colors for probability indicators
 */
export const goalColors = {
  excellent: '#22C55E',
  onTrack: '#3B82F6',
  attention: '#F59E0B',
  atRisk: '#EF4444',
} as const;

/**
 * Account type colors for visual differentiation
 */
export const accountColors = {
  checking: '#22C55E',
  savings: '#3B82F6',
  credit: '#F59E0B',
  investment: '#8B5CF6',
  crypto: '#FBBF24',
  default: '#6B7280',
} as const;

/**
 * UI surface and text colors
 */
export const surfaceColors = {
  light: {
    background: '#FAFAFA',
    surface: '#FFFFFF',
    surfaceVariant: '#F5F5F5',
    textPrimary: '#212121',
    textSecondary: '#757575',
    textMuted: '#9E9E9E',
    border: '#E0E0E0',
    divider: '#EEEEEE',
  },
  dark: {
    background: '#121212',
    surface: '#1E1E1E',
    surfaceVariant: '#2E2E2E',
    textPrimary: '#FFFFFF',
    textSecondary: '#B0B0B0',
    textMuted: '#757575',
    border: '#424242',
    divider: '#333333',
  },
} as const;

/**
 * Complete color token export
 */
export const colors = {
  semantic: semanticColors,
  financial: financialColors,
  goal: goalColors,
  account: accountColors,
  surface: surfaceColors,
} as const;

/**
 * Helper function to get transaction color by type
 */
export function getTransactionColor(type: 'income' | 'expense' | 'transfer' | string): string {
  switch (type) {
    case 'income':
      return financialColors.income;
    case 'expense':
      return financialColors.expense;
    case 'transfer':
      return financialColors.transfer;
    default:
      return financialColors.neutral;
  }
}

/**
 * Helper function to get account color by type
 */
export function getAccountColor(type: string): string {
  const normalizedType = type.toLowerCase();
  switch (normalizedType) {
    case 'checking':
      return accountColors.checking;
    case 'savings':
      return accountColors.savings;
    case 'credit':
      return accountColors.credit;
    case 'investment':
      return accountColors.investment;
    case 'crypto':
      return accountColors.crypto;
    default:
      return accountColors.default;
  }
}

/**
 * Helper function to get goal health color by probability
 */
export function getGoalHealthColor(probability: number): string {
  if (probability >= 90) return goalColors.excellent;
  if (probability >= 75) return goalColors.onTrack;
  if (probability >= 50) return goalColors.attention;
  return goalColors.atRisk;
}

export default colors;
