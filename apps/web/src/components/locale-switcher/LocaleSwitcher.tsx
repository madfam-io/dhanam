'use client';

import { useContext } from 'react';
import { I18nContext, useTranslation } from '@dhanam/shared';
import { usePostHog } from '~/providers/PostHogProvider';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Button,
} from '@dhanam/ui';

/**
 * LocaleSwitcher Component
 *
 * Allows users to switch between English and Spanish.
 * Tracks locale changes with PostHog analytics.
 *
 * Usage:
 * ```tsx
 * import { LocaleSwitcher } from '~/components/locale-switcher';
 *
 * export function Header() {
 *   return (
 *     <header>
 *       <LocaleSwitcher />
 *     </header>
 *   );
 * }
 * ```
 */
export function LocaleSwitcher() {
  const context = useContext(I18nContext);
  const { t } = useTranslation();
  const posthog = usePostHog();

  if (!context) {
    console.error('LocaleSwitcher must be used within I18nProvider');
    return null;
  }

  const { locale, setLocale } = context;

  const handleLocaleChange = (newLocale: 'en' | 'es') => {
    if (newLocale === locale) return;

    setLocale(newLocale);

    // Track locale change in PostHog
    posthog.capture('locale_changed', {
      from_locale: locale,
      to_locale: newLocale,
    });

    // Update HTML lang attribute
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLocale;
    }
  };

  const locales = [
    { code: 'es' as const, name: 'Español', flag: '🇲🇽' },
    { code: 'en' as const, name: 'English', flag: '🇺🇸' },
  ];

  const currentLocale = locales.find((l) => l.code === locale) || locales[0]!;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">
            {currentLocale.flag} {currentLocale.name}
          </span>
          <span className="sm:hidden">{currentLocale.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => handleLocaleChange(l.code)}
            className={locale === l.code ? 'bg-accent' : ''}
          >
            <span className="mr-2">{l.flag}</span>
            <span>{l.name}</span>
            {locale === l.code && (
              <span className="ml-auto text-xs text-muted-foreground">{t('common.active')}</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
