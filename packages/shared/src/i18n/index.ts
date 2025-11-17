/**
 * i18n Module
 * Centralized internationalization for Dhanam Ledger
 * Supports English (en) and Spanish (es)
 */

import * as es from './es';
import { common as enCommon } from './en/common';

// Export translation objects
export const translations = {
  en: {
    common: enCommon,
    // Note: Other English modules should mirror Spanish structure
    // For now, using minimal common translations for English
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
export type Locale = 'en' | 'es';
export type TranslationNamespace = keyof typeof translations.es;
export type Translations = typeof translations;

// Legacy export for backwards compatibility
export const i18n = translations;