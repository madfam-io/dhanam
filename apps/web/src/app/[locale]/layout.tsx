'use client';

import { use } from 'react';
import { I18nProvider, type Locale } from '@dhanam/shared';

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // React.use() unwraps the params Promise in client components (Next.js 15)
  const { locale: localeParam } = use(params);
  const locale = (['en', 'es', 'pt-BR'].includes(localeParam) ? localeParam : 'es') as Locale;

  return <I18nProvider defaultLocale={locale}>{children}</I18nProvider>;
}
