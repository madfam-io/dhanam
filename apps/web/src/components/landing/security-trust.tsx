'use client';

import { useTranslation } from '@dhanam/shared';
import { Shield, KeyRound, Eye, ClipboardList } from 'lucide-react';

const pillars = [
  { key: 'encryption' as const, icon: Shield, color: 'blue' },
  { key: 'authentication' as const, icon: KeyRound, color: 'purple' },
  { key: 'readOnly' as const, icon: Eye, color: 'green' },
  { key: 'auditTrail' as const, icon: ClipboardList, color: 'orange' },
] as const;

const colorMap: Record<string, string> = {
  blue: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600',
  purple: 'bg-purple-100 dark:bg-purple-900/50 text-purple-600',
  green: 'bg-green-100 dark:bg-green-900/50 text-green-600',
  orange: 'bg-orange-100 dark:bg-orange-900/50 text-orange-600',
};

export function SecurityTrust() {
  const { t } = useTranslation('landing');

  return (
    <section className="container mx-auto px-6 py-16 bg-muted/30">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">{t('securityTrust.title')}</h2>
        <p className="text-muted-foreground">{t('securityTrust.subtitle')}</p>
      </div>

      <div className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {pillars.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <div key={pillar.key} className="rounded-lg border bg-card p-6 text-center">
              <div
                className={`h-12 w-12 rounded-lg flex items-center justify-center mb-4 mx-auto ${colorMap[pillar.color]}`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <h4 className="text-lg font-semibold mb-2">
                {t(`securityTrust.${pillar.key}.title`)}
              </h4>
              <p className="text-sm text-muted-foreground">
                {t(`securityTrust.${pillar.key}.description`)}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
