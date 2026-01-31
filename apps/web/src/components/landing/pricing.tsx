'use client';

import { Button } from '@dhanam/ui';
import { useTranslation, I18nContext } from '@dhanam/shared';
import { useContext } from 'react';
import { CheckCircle } from 'lucide-react';

interface PricingProps {
  onSignUpClick: () => void;
}

export function Pricing({ onSignUpClick }: PricingProps) {
  const { t } = useTranslation('landing');
  const i18n = useContext(I18nContext);

  // Access feature arrays from raw translation data
  const lang = (i18n?.translations as any)?.[i18n?.locale ?? 'en']?.landing?.pricing;
  const freeFeatures: string[] = lang?.free?.features ?? [];
  const proFeatures: string[] = lang?.pro?.features ?? [];

  return (
    <section className="container mx-auto px-6 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{t('pricing.title')}</h2>
          <p className="text-muted-foreground">{t('pricing.subtitle')}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Free */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-xl font-bold mb-2">{t('pricing.free.name')}</h3>
            <p className="text-3xl font-bold mb-4">{t('pricing.free.price')}</p>
            <ul className="space-y-2 text-sm mb-6">
              {freeFeatures.map((item, index) => (
                <li key={index} className="flex gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" /> {item}
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full" onClick={onSignUpClick}>
              {t('pricing.free.ctaText')}
            </Button>
          </div>

          {/* Premium */}
          <div className="rounded-lg border-2 border-primary bg-card p-6 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
              {t('pricing.mostPopular')}
            </div>
            <h3 className="text-xl font-bold mb-2">{t('pricing.pro.name')}</h3>
            <p className="text-3xl font-bold mb-4">
              {t('pricing.pro.price')}
              <span className="text-sm font-normal text-muted-foreground">
                /{t('pricing.pro.period')}
              </span>
            </p>
            <ul className="space-y-2 text-sm mb-6">
              {proFeatures.map((item, index) => {
                const isBold = index === 0; // First item is "Everything in Free, plus:"
                return (
                  <li key={index} className="flex gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                    {isBold ? <strong>{item}</strong> : item}
                  </li>
                );
              })}
            </ul>
            <Button
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
              onClick={onSignUpClick}
            >
              {t('pricing.pro.ctaText')}
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              {t('pricing.cancelAnytime')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
