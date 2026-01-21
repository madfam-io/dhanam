/**
 * i18n Module
 * Centralized internationalization for Dhanam Ledger
 * Supports English (en) and Spanish (es)
 */

import * as es from './es';
import * as en from './en';

// Export translation objects
export const translations = {
  en: {
    common: en.common,
    auth: en.auth,
  },
  es: {
    common: es.common,
    auth: es.auth,
    transactions: es.transactions,
    budgets: es.budgets,
    accounts: es.accounts,
    spaces: es.spaces,
    wealth: es.wealth,
    errors: es.errors,
    validations: es.validations,
  },
} as const;

// Type exports
// Note: Locale type is exported from ./types/common.types.ts
export type TranslationNamespace = keyof typeof translations.es;
export type Translations = typeof translations;

// Legacy export for backwards compatibility
export const i18n = translations;

// Export React components and hooks
export { I18nProvider, I18nContext, withI18n } from '../contexts/I18nContext';
export type { I18nContextValue, I18nProviderProps } from '../contexts/I18nContext';
export { useTranslation } from '../hooks/useTranslation';