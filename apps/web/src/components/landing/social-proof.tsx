'use client';

import { useTranslation, I18nContext } from '@dhanam/shared';
import { useContext } from 'react';
import { ExternalLink } from 'lucide-react';

const partnerLogos: Record<string, string> = {
  Belvo: '🏦',
  Plaid: '🔗',
  Bitso: '₿',
  Zapper: '⚡',
  Zillow: '🏠',
  Banxico: '🇲🇽',
};

export function SocialProof() {
  const { t } = useTranslation('landing');
  const i18n = useContext(I18nContext);

  const translations = i18n?.translations as
    | Record<
        string,
        {
          landing?: {
            trustSignals?: {
              partners?: string[];
            };
          };
        }
      >
    | undefined;
  const partners: string[] =
    translations?.[i18n?.locale ?? 'en']?.landing?.trustSignals?.partners ?? [];

  return (
    <section className="container mx-auto px-6 py-16 bg-muted/30">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <h2 className="text-3xl font-bold">{t('trustSignals.title')}</h2>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-6">
          {partners.map((partner) => (
            <div key={partner} className="flex flex-col items-center gap-2">
              <div className="h-14 w-14 rounded-lg bg-card border flex items-center justify-center text-2xl">
                {partnerLogos[partner] ?? '🔌'}
              </div>
              <span className="text-sm font-medium">{partner}</span>
            </div>
          ))}
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border bg-green-50 dark:bg-green-950/20 px-4 py-2 text-sm">
          <ExternalLink className="h-4 w-4 text-green-600" />
          <span className="font-medium text-green-700 dark:text-green-400">
            {t('trustSignals.openSource')}
          </span>
        </div>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          {t('trustSignals.openSourceDescription')}
        </p>
      </div>
    </section>
  );
}
