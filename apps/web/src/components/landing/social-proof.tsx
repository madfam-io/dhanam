'use client';

import { useTranslation } from '@dhanam/shared';
import { Users, Zap, Award } from 'lucide-react';

export function SocialProof() {
  const { t } = useTranslation('landing');
  return (
    <section className="container mx-auto px-6 py-16 bg-muted/30">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <h2 className="text-3xl font-bold">{t('socialProof.title')}</h2>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center">
            <Users className="h-8 w-8 text-blue-600 mb-2" />
            <p className="text-3xl font-bold">5K+</p>
            <p className="text-sm text-muted-foreground">{t('socialProof.activeUsers')}</p>
          </div>
          <div className="flex flex-col items-center">
            <Zap className="h-8 w-8 text-purple-600 mb-2" />
            <p className="text-3xl font-bold">100K+</p>
            <p className="text-sm text-muted-foreground">{t('socialProof.simulationsRun')}</p>
          </div>
          <div className="flex flex-col items-center">
            <Award className="h-8 w-8 text-green-600 mb-2" />
            <p className="text-3xl font-bold">4.8★</p>
            <p className="text-sm text-muted-foreground">{t('socialProof.userRating')}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
