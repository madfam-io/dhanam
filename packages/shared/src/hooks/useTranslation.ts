/**
 * useTranslation Hook
 * React hook for accessing translations
 *
 * @example
 * const { t, locale, setLocale } = useTranslation();
 * t('common.save'); // => "Save" or "Guardar"
 */

import { useContext } from 'react';
import { I18nContext } from '../contexts/I18nContext';
import type { TranslationNamespace } from '../i18n';

export function useTranslation(_namespace?: TranslationNamespace) {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }

  const { locale, setLocale, translations } = context;

  /**
   * Translate a key
   * @param key - Translation key in dot notation (e.g., "common.save")
   * @param params - Optional parameters for interpolation
   */
  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = translations[locale];

    // Navigate through the nested object
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) {
        console.warn(`Translation key not found: ${key} for locale: ${locale}`);
        return key;
      }
    }

    // If params provided, perform string interpolation
    if (params && typeof value === 'string') {
      return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
        return params[paramKey]?.toString() || match;
      });
    }

    return value?.toString() || key;
  };

  /**
   * Check if a translation key exists
   */
  const hasKey = (key: string): boolean => {
    const keys = key.split('.');
    let value: any = translations[locale];

    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) return false;
    }

    return true;
  };

  /**
   * Get all translations for a namespace
   */
  const getNamespace = (ns: TranslationNamespace) => {
    // Type assertion needed because en locale doesn't have all namespaces yet
    return (translations[locale] as any)[ns];
  };

  return {
    t,
    hasKey,
    getNamespace,
    locale,
    setLocale,
  };
}

/**
 * useLocale Hook
 * Lightweight hook for just locale access/updates
 */
export function useLocale() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useLocale must be used within an I18nProvider');
  }

  return {
    locale: context.locale,
    setLocale: context.setLocale,
  };
}
