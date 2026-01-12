import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { semanticColors, surfaceColors } from '../tokens/colors';

/**
 * DHANAM Mobile Theme
 *
 * Theme configuration using design tokens for consistent styling.
 * All colors reference the centralized token system.
 */

const lightColors = {
  ...MD3LightTheme.colors,
  // Primary brand color (solarpunk green)
  primary: semanticColors.success,
  primaryContainer: '#E8F5E8',
  // Secondary accent
  secondary: semanticColors.info,
  secondaryContainer: '#E3F2FD',
  // Tertiary accent
  tertiary: semanticColors.warning,
  tertiaryContainer: '#FFF3E0',
  // Surface colors from token system
  surface: surfaceColors.light.surface,
  surfaceVariant: surfaceColors.light.surfaceVariant,
  background: surfaceColors.light.background,
  // Error state
  error: semanticColors.error,
  errorContainer: '#FFEBEE',
  // On-colors for contrast
  onPrimary: '#FFFFFF',
  onSecondary: '#FFFFFF',
  onSurface: surfaceColors.light.textPrimary,
  onBackground: surfaceColors.light.textPrimary,
  outline: surfaceColors.light.border,
  // Semantic status colors (extended)
  success: semanticColors.success,
  warning: semanticColors.warning,
  info: semanticColors.info,
};

const darkColors = {
  ...MD3DarkTheme.colors,
  // Primary brand color (lighter for dark mode)
  primary: '#66BB6A',
  primaryContainer: '#2E7D32',
  // Secondary accent
  secondary: '#42A5F5',
  secondaryContainer: '#1976D2',
  // Tertiary accent
  tertiary: '#FFB74D',
  tertiaryContainer: '#F57C00',
  // Surface colors from token system
  surface: surfaceColors.dark.surface,
  surfaceVariant: surfaceColors.dark.surfaceVariant,
  background: surfaceColors.dark.background,
  // Error state
  error: '#EF5350',
  errorContainer: '#B71C1C',
  // On-colors for contrast
  onPrimary: '#FFFFFF',
  onSecondary: '#FFFFFF',
  onSurface: surfaceColors.dark.textPrimary,
  onBackground: surfaceColors.dark.textPrimary,
  outline: surfaceColors.dark.border,
  // Semantic status colors (extended)
  success: '#66BB6A',
  warning: '#FFB74D',
  info: '#42A5F5',
};

export const theme = {
  light: {
    ...MD3LightTheme,
    colors: lightColors,
  },
  dark: {
    ...MD3DarkTheme,
    colors: darkColors,
  },
};

export type AppTheme = typeof theme.light;
