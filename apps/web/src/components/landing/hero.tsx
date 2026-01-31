'use client';

import { Button } from '@dhanam/ui';
import { useTranslation } from '@dhanam/shared';
import { Sparkles, ArrowRight } from 'lucide-react';

interface HeroProps {
  onLiveDemoClick: () => void;
  onSignUpClick: () => void;
}

export function Hero({ onLiveDemoClick, onSignUpClick }: HeroProps) {
  const { t } = useTranslation('landing');

  return (
    <section className="container mx-auto px-6 py-16 md:py-24">
      <div className="text-center space-y-6 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-full px-4 py-2 mb-4">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium">{t('hero.badge')}</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">{t('hero.title')}</h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          {t('hero.subtitle')}
        </p>

        <p className="text-sm text-muted-foreground max-w-xl mx-auto">{t('hero.subDescription')}</p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button
            size="lg"
            onClick={onLiveDemoClick}
            className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {t('hero.cta')}
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" onClick={onSignUpClick} className="gap-2">
            {t('hero.ctaSecondary')}
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">{t('hero.demoNote')}</p>
      </div>

      {/* Stats Cards */}
      <div className="mt-12 grid grid-cols-3 gap-4 max-w-2xl mx-auto">
        <div className="text-center p-4 rounded-lg bg-card border">
          <p className="text-3xl font-bold text-green-600">73%</p>
          <p className="text-xs text-muted-foreground">{t('hero.stats.goalSuccess')}</p>
        </div>
        <div className="text-center p-4 rounded-lg bg-card border">
          <p className="text-3xl font-bold">$1.2M</p>
          <p className="text-xs text-muted-foreground">{t('hero.stats.nestEgg')}</p>
        </div>
        <div className="text-center p-4 rounded-lg bg-card border">
          <p className="text-3xl font-bold">12</p>
          <p className="text-xs text-muted-foreground">{t('hero.stats.scenarios')}</p>
        </div>
      </div>
    </section>
  );
}
