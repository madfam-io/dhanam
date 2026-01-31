'use client';

import { useTranslation } from '@dhanam/shared';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export function ProblemSolution() {
  const { t } = useTranslation('landing');
  return (
    <section className="container mx-auto px-6 py-16 bg-muted/30">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">
          {t('problemSolution.title')}
          <br />
          <span className="text-primary">{t('problemSolution.titleHighlight')}</span>
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-card p-6">
            <div className="flex items-center gap-2 text-red-600 mb-4">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="font-semibold">{t('problemSolution.budgetTrackers')}</h3>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {([1, 2, 3, 4, 5, 6] as const).map((n) => (
                <li key={n} className="flex gap-2">
                  <span className="text-red-600">&#10007;</span> {t(`problemSolution.problem${n}`)}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-green-200 dark:border-green-900/50 bg-card p-6">
            <div className="flex items-center gap-2 text-green-600 mb-4">
              <CheckCircle className="h-5 w-5" />
              <h3 className="font-semibold">Dhanam</h3>
            </div>
            <ul className="space-y-2 text-sm">
              {([1, 2, 3, 4, 5, 6] as const).map((n) => (
                <li key={n} className="flex gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />{' '}
                  {t(`problemSolution.solution${n}`)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
