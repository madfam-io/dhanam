import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

const lightColors = {
  ...MD3LightTheme.colors,
  primary: '#4CAF50',
  primaryContainer: '#E8F5E8',
  secondary: '#2196F3',
  secondaryContainer: '#E3F2FD',
  tertiary: '#FF9800',
  tertiaryContainer: '#FFF3E0',
  surface: '#FFFFFF',
  surfaceVariant: '#F5F5F5',
  background: '#FAFAFA',
  error: '#F44336',
  errorContainer: '#FFEBEE',
  onPrimary: '#FFFFFF',
  onSecondary: '#FFFFFF',
  onSurface: '#212121',
  onBackground: '#212121',
  outline: '#E0E0E0',
  success: '#4CAF50',
  warning: '#FF9800',
  info: '#2196F3',
};

const darkColors = {
  ...MD3DarkTheme.colors,
  primary: '#66BB6A',
  primaryContainer: '#2E7D32',
  secondary: '#42A5F5',
  secondaryContainer: '#1976D2',
  tertiary: '#FFB74D',
  tertiaryContainer: '#F57C00',
  surface: '#1E1E1E',
  surfaceVariant: '#2E2E2E',
  background: '#121212',
  error: '#EF5350',
  errorContainer: '#B71C1C',
  onPrimary: '#FFFFFF',
  onSecondary: '#FFFFFF',
  onSurface: '#FFFFFF',
  onBackground: '#FFFFFF',
  outline: '#424242',
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
