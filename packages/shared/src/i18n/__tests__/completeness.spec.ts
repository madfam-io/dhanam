/**
 * Translation Key Completeness Test
 * Verifies all namespaces have matching keys across locales.
 * Run: pnpm --filter @dhanam/shared test
 */

import * as es from '../es';
import * as en from '../en';
import * as ptBR from '../pt-BR';

// Build a minimal translations object for testing (no React imports needed)
const translations = { en, es, 'pt-BR': ptBR };

type TranslationObj = Record<string, unknown>;

/**
 * Recursively collect all dot-separated keys from a nested object
 */
function collectKeys(obj: unknown, prefix = ''): string[] {
  if (obj === null || obj === undefined || typeof obj !== 'object') return [];
  if (Array.isArray(obj)) return [prefix]; // arrays are leaf values

  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj as TranslationObj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...collectKeys(v, path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}

const locales = Object.keys(translations) as Array<keyof typeof translations>;
const namespaces = Object.keys(translations.es) as Array<keyof typeof translations.es>;

describe('Translation completeness', () => {
  for (const namespace of namespaces) {
    describe(`namespace: ${namespace}`, () => {
      const esKeys = collectKeys((translations.es as any)[namespace]).sort();

      for (const locale of locales) {
        it(`${locale} has all keys from es/${namespace}`, () => {
          const localeKeys = collectKeys((translations[locale] as any)[namespace]).sort();
          const missing = esKeys.filter((k) => !localeKeys.includes(k));

          expect(missing).toEqual([]);
        });
      }
    });
  }
});
