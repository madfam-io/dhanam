'use client';

import { useTranslation } from '@dhanam/shared';
import { Link2, Cpu, BarChart3, Target } from 'lucide-react';

const steps = [
  { number: 1, key: 'step1' as const, icon: Link2, color: 'blue' as const },
  { number: 2, key: 'step2' as const, icon: Cpu, color: 'purple' as const },
  { number: 3, key: 'step3' as const, icon: BarChart3, color: 'orange' as const },
  { number: 4, key: 'step4' as const, icon: Target, color: 'green' as const },
] as const;

const colorMap = {
  blue: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600',
  purple: 'bg-purple-100 dark:bg-purple-900/50 text-purple-600',
  orange: 'bg-orange-100 dark:bg-orange-900/50 text-orange-600',
  green: 'bg-green-100 dark:bg-green-900/50 text-green-600',
} as const;

export function HowItWorks() {
  const { t } = useTranslation('landing');

  return (
    <section className="container mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">{t('howItWorks.title')}</h2>
        <p className="text-muted-foreground">
          {t('howItWorks.subtitle')}
        </p>
      </div>

      <div className="max-w-5xl mx-auto grid md:grid-cols-4 gap-8">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div key={step.number} className="text-center space-y-3">
              <div className="relative mx-auto">
                <div
                  className={`h-14 w-14 mx-auto rounded-full flex items-center justify-center ${colorMap[step.color]}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <span className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {step.number}
                </span>
              </div>
              <h3 className="text-lg font-semibold">{t(`howItWorks.${step.key}.title`)}</h3>
              <p className="text-sm text-muted-foreground">{t(`howItWorks.${step.key}.description`)}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
