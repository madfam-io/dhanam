import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { cookies } from 'next/headers';
import { Providers } from '~/lib/providers';
import { Toaster } from 'sonner';
import '~/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Dhanam - Budget & Wealth Tracker',
  description: 'Comprehensive financial management for personal and business',
  alternates: {
    languages: {
      es: 'https://dhan.am/es',
      en: 'https://dhan.am/en',
      'pt-BR': 'https://dhan.am/pt-BR',
    },
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const locale = cookieStore.get('dhanam_locale')?.value || 'es';
  const ogLocale = locale === 'en' ? 'en_US' : locale === 'pt-BR' ? 'pt_BR' : 'es_MX';

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="alternate" hrefLang="es" href="https://dhan.am/es" />
        <link rel="alternate" hrefLang="en" href="https://dhan.am/en" />
        <link rel="alternate" hrefLang="pt-BR" href="https://dhan.am/pt-BR" />
        <meta property="og:locale" content={locale === 'en' ? 'en_US' : locale === 'pt-BR' ? 'pt_BR' : 'es_MX'} />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
