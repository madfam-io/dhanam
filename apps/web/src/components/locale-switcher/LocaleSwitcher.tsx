'use client';

import { useContext } from 'react';
import { I18nContext, useTranslation } from '@dhanam/shared';
import type { Locale } from '@dhanam/shared';
import { usePostHog } from '~/providers/PostHogProvider';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Button,
} from '@dhanam/ui';

const locales: Array<{ code: Locale; name: string; flag: string }> = [
  { code: 'es', name: 'Español', flag: '🇲🇽' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'pt-BR', name: 'Português', flag: '🇧🇷' },
];

export function LocaleSwitcher() {
  const context = useContext(I18nContext);
  const { t } = useTranslation();
  const posthog = usePostHog();

  if (!context) {
    console.error('LocaleSwitcher must be used within I18nProvider');
    return null;
  }

  const { locale, setLocale } = context;

  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale === locale) return;

    setLocale(newLocale);

    posthog.capture('locale_changed', {
      from_locale: locale,
      to_locale: newLocale,
    });

    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLocale;
      // Also set cookie so server layout can read it
      document.cookie = `dhanam_locale=${newLocale};path=/;max-age=31536000;SameSite=Lax`;
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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
