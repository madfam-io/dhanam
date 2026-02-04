'use client';

import { I18nProvider, type Locale } from '@dhanam/shared';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Validate and normalize locale from URL param
  const { locale: localeParam } = await params;
  const locale = (['en', 'es', 'pt-BR'].includes(localeParam) ? localeParam : 'es') as Locale;

  return <I18nProvider defaultLocale={locale}>{children}</I18nProvider>;
}
