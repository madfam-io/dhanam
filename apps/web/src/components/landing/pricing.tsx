'use client';

import { Button } from '@dhanam/ui';
import { useTranslation, I18nContext } from '@dhanam/shared';
import { useContext } from 'react';
import { CheckCircle } from 'lucide-react';

interface PricingProps {
  onSignUpClick: () => void;
}

const tiers = ['community', 'essentials', 'pro'] as const;

export function Pricing({ onSignUpClick }: PricingProps) {
  const { t } = useTranslation('landing');
  const i18n = useContext(I18nContext);

  const lang = (i18n?.translations as any)?.[i18n?.locale ?? 'en']?.landing?.pricing;

  return (
    <section className="container mx-auto px-6 py-16">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{t('pricing.title')}</h2>
          <p className="text-muted-foreground">{t('pricing.subtitle')}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map((tier) => {
            const features: string[] = lang?.[tier]?.features ?? [];
            const isPro = tier === 'pro';
            const isEssentials = tier === 'essentials';

            return (
              <div
                key={tier}
                className={`rounded-lg bg-card p-6 relative ${
                  isPro ? 'border-2 border-primary' : 'border'
                }`}
              >
                {isPro && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    {t('pricing.mostPopular')}
                  </div>
                )}
                {isEssentials && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    {t('pricing.bestValue')}
                  </div>
                )}
                <h3 className="text-xl font-bold mb-2">{t(`pricing.${tier}.name`)}</h3>
                <p className="text-3xl font-bold mb-4">
                  {t(`pricing.${tier}.price`)}
                  {tier !== 'community' && (
                    <span className="text-sm font-normal text-muted-foreground">
                      /{t(`pricing.${tier}.period`)}
                    </span>
                  )}
                </p>
                <ul className="space-y-2 text-sm mb-6">
                  {features.map((item, index) => {
                    const isBold = index === 0 && tier !== 'community';
                    return (
                      <li key={index} className="flex gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        {isBold ? <strong>{item}</strong> : item}
                      </li>
                    );
                  })}
                </ul>
                <Button
                  className={`w-full ${isPro ? 'bg-gradient-to-r from-blue-600 to-purple-600' : ''}`}
                  variant={tier === 'community' ? 'outline' : 'default'}
                  onClick={onSignUpClick}
                >
                  {t(`pricing.${tier}.ctaText`)}
                </Button>
                {tier !== 'community' && (
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    {t('pricing.cancelAnytime')}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
