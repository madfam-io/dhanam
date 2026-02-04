'use client';

import { I18nProvider, type Locale } from '@dhanam/shared';

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Validate and normalize locale from URL param
  const locale = (['en', 'es', 'pt-BR'].includes(params.locale)
    ? params.locale
    : 'es') as Locale;

  return <I18nProvider defaultLocale={locale}>{children}</I18nProvider>;
}
