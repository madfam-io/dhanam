'use client';

import { useTranslation } from '@dhanam/shared';
import { Landmark, Coins, Home, Gamepad2, Cpu, HeartPulse } from 'lucide-react';

// Feature configuration with icons and colors
const featureConfig = [
  { key: 'feature1' as const, icon: Landmark, color: 'blue' },
  { key: 'feature2' as const, icon: Coins, color: 'purple' },
  { key: 'feature3' as const, icon: Home, color: 'teal' },
  { key: 'feature4' as const, icon: Gamepad2, color: 'pink' },
  { key: 'feature5' as const, icon: Cpu, color: 'violet' },
  { key: 'feature6' as const, icon: HeartPulse, color: 'red' },
] as const;

const colorMap: Record<string, string> = {
  blue: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600',
  purple: 'bg-purple-100 dark:bg-purple-900/50 text-purple-600',
  teal: 'bg-teal-100 dark:bg-teal-900/50 text-teal-600',
  pink: 'bg-pink-100 dark:bg-pink-900/50 text-pink-600',
  violet: 'bg-violet-100 dark:bg-violet-900/50 text-violet-600',
  amber: 'bg-amber-100 dark:bg-amber-900/50 text-amber-600',
  cyan: 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600',
  orange: 'bg-orange-100 dark:bg-orange-900/50 text-orange-600',
  green: 'bg-green-100 dark:bg-green-900/50 text-green-600',
  red: 'bg-red-100 dark:bg-red-900/50 text-red-600',
  indigo: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600',
};

export function FeaturesGrid() {
  const { t } = useTranslation('landing');

  return (
    <section className="container mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">{t('features.title')}</h2>
        <p className="text-muted-foreground">{t('features.subtitle')}</p>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureConfig.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.key}
                className="rounded-lg border bg-card p-6 hover:shadow-lg transition-shadow"
              >
                <div
                  className={`h-12 w-12 rounded-lg flex items-center justify-center mb-4 ${colorMap[feature.color]}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h4 className="text-lg font-semibold mb-2">{t(`features.${feature.key}.title`)}</h4>
                <p className="text-sm text-muted-foreground">
                  {t(`features.${feature.key}.description`)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
