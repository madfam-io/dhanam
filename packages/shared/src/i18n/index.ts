/**
 * i18n Module
 * Centralized internationalization for Dhanam Ledger
 * Supports English (en), Spanish (es), and Portuguese-BR (pt-BR)
 */

import * as es from './es';
import * as en from './en';
import * as ptBR from './pt-BR';

// Export translation objects
export const translations = {
  en: {
    common: en.common,
    auth: en.auth,
    transactions: en.transactions,
    budgets: en.budgets,
    accounts: en.accounts,
    spaces: en.spaces,
    wealth: en.wealth,
    errors: en.errors,
    validations: en.validations,
    estatePlanning: en.estatePlanning,
    households: en.households,
    transactionExecution: en.transactionExecution,
    email: en.email,
    apiErrors: en.apiErrors,
    landing: en.landing,
    dashboard: en.dashboard,
    settings: en.settings,
    projections: en.projections,
    assets: en.assets,
    goals: en.goals,
    gaming: en.gaming,
    esg: en.esg,
    analytics: en.analytics,
    reports: en.reports,
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
    estatePlanning: es.estatePlanning,
    households: es.households,
    transactionExecution: es.transactionExecution,
    email: es.email,
    apiErrors: es.apiErrors,
    landing: es.landing,
    dashboard: es.dashboard,
    settings: es.settings,
    projections: es.projections,
    assets: es.assets,
    goals: es.goals,
    gaming: es.gaming,
    esg: es.esg,
    analytics: es.analytics,
    reports: es.reports,
  },
  'pt-BR': {
    common: ptBR.common,
    auth: ptBR.auth,
    transactions: ptBR.transactions,
    budgets: ptBR.budgets,
    accounts: ptBR.accounts,
    spaces: ptBR.spaces,
    wealth: ptBR.wealth,
    errors: ptBR.errors,
    validations: ptBR.validations,
    estatePlanning: ptBR.estatePlanning,
    households: ptBR.households,
    transactionExecution: ptBR.transactionExecution,
    email: ptBR.email,
    apiErrors: ptBR.apiErrors,
    landing: ptBR.landing,
    dashboard: ptBR.dashboard,
    settings: ptBR.settings,
    projections: ptBR.projections,
    assets: ptBR.assets,
    goals: ptBR.goals,
    gaming: ptBR.gaming,
    esg: ptBR.esg,
    analytics: ptBR.analytics,
    reports: ptBR.reports,
  },
} as const;

// Type exports
export type TranslationNamespace = keyof typeof translations.es;
export type Translations = typeof translations;

// Legacy export for backwards compatibility
export const i18n = translations;

// Export React components and hooks
export { I18nProvider, I18nContext, withI18n } from '../contexts/I18nContext';
export type { I18nContextValue, I18nProviderProps } from '../contexts/I18nContext';
export { useTranslation } from '../hooks/useTranslation';
